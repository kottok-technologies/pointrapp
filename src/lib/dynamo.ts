import {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    QueryCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ScanCommand,
    AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { fromSSO } from "@aws-sdk/credential-provider-sso";

type AttrMap = Record<string, AttributeValue>;

// ============================================================
// ⚙️ DynamoDB Client Setup
// ============================================================

const isLocalhost =
    process.env.HOSTNAME === "localhost" ||
    process.env.HOST === "localhost" ||
    process.env.NODE_ENV === "development";

// Dynamically configure the client
const getDynamoClient = () => {
    if (isLocalhost) {
        return new DynamoDBClient({
            region: process.env.AWS_REGION,
            credentials: fromSSO({
                profile: process.env.AWS_PROFILE_NAME,
            }),
        });
    }
    return new DynamoDBClient({
        region: process.env.AWS_REGION,
    });
};

const dynamo = getDynamoClient();

// ============================================================
// 🧩 Table Names (required env vars)
// ============================================================

const TableName = process.env.DYNAMODB_TABLE_NAME!;
if (!TableName)
    throw new Error("❌ Missing DYNAMODB_TABLE_NAME environment variable");

const ConnectionTableName = process.env.CONNECTIONS_TABLE!;
if (!ConnectionTableName)
    throw new Error("❌ Missing CONNECTIONS_TABLE environment variable");

// ============================================================
// 🧠 Case Conversion Utilities
// ============================================================

/** Converts DynamoDB-style keys (PascalCase / snake_case) → camelCase recursively */
function toCamelCaseKeys<T>(obj: unknown): T {
    if (Array.isArray(obj)) {
        return obj.map((i) => toCamelCaseKeys(i)) as unknown as T;
    }
    if (obj && typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            const camelKey = key
                .charAt(0)
                .toLowerCase()
                .concat(key.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase()));
            result[camelKey] = toCamelCaseKeys(value);
        }
        return result as T;
    }
    return obj as T;
}

/** Converts camelCase → PascalCase recursively (for writing to DynamoDB) */
function toPascalCaseKeys<T>(obj: unknown): T {
    if (Array.isArray(obj)) {
        return obj.map((i) => toPascalCaseKeys(i)) as unknown as T;
    }
    if (obj && typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
            result[pascalKey] = toPascalCaseKeys(value);
        }
        return result as T;
    }
    return obj as T;
}

// ============================================================
// 🧩 Safe Marshalling / Unmarshalling
// ============================================================

function safeMarshall<T extends object>(obj: T): AttrMap {
    const pascalized = toPascalCaseKeys(obj);
    return marshall(pascalized, { removeUndefinedValues: true }) as AttrMap;
}

function safeUnmarshall<T>(item: AttrMap): T {
    const raw = unmarshall(item);
    return toCamelCaseKeys<T>(raw);
}

// ============================================================
// 🧱 Core CRUD Utilities
// ============================================================

/** ✅ Put (create or replace) an item */
export async function putItem<T extends object>(item: T): Promise<void> {
    await dynamo.send(
        new PutItemCommand({
            TableName,
            Item: safeMarshall(item),
        })
    );
}

/** ✅ Get item by PK + SK */
export async function getItem<T>(pk: string): Promise<T | null> {
    const { Item } = await dynamo.send(
        new GetItemCommand({
            TableName,
            Key: safeMarshall({ PK: pk}),
        })
    );
    return Item ? safeUnmarshall<T>(Item as AttrMap) : null;
}

/** ✅ Delete by PK + SK */
export async function deleteItem(pk: string): Promise<void> {
    await dynamo.send(
        new DeleteItemCommand({
            TableName,
            Key: safeMarshall({ PK: pk}),
        })
    );
}

/** ✅ Query all items for a given PK (e.g., all USERS for a ROOM) */
export async function queryByPK<T>(pk: string): Promise<T[]> {
    const { Items } = await dynamo.send(
        new QueryCommand({
            TableName,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: marshall({ ":pk": pk }),
        })
    );
    return (Items || []).map((i) => safeUnmarshall<T>(i as AttrMap));
}

/** ✅ Query by Global Secondary Index */
export async function queryByGSI<T>(
    indexName: string,
    keyName: string,
    keyValue: string
): Promise<T[]> {
    const { Items } = await dynamo.send(
        new QueryCommand({
            TableName,
            IndexName: indexName,
            KeyConditionExpression: `${keyName} = :v`,
            ExpressionAttributeValues: marshall({ ":v": keyValue }),
        })
    );
    return (Items || []).map((i) => safeUnmarshall<T>(i as AttrMap));
}

/** ✅ Partial update (safe) */
export async function updateItem<T>(
    pk: string,
    sk: string,
    updates: Partial<T>
): Promise<void> {
    const setExpressions: string[] = [];
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
        const nameKey = `#${key}`;
        const valKey = `:${key}`;
        setExpressions.push(`${nameKey} = ${valKey}`);
        exprNames[nameKey] = key;
        exprValues[valKey] = value;
    }

    await dynamo.send(
        new UpdateItemCommand({
            TableName,
            Key: safeMarshall({ PK: pk, SK: sk }),
            UpdateExpression: `SET ${setExpressions.join(", ")}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: marshall(exprValues),
        })
    );
}

/** ⚠️ Scan everything (use only for admin or dev) */
export async function scanAll<T>(): Promise<T[]> {
    const { Items } = await dynamo.send(new ScanCommand({ TableName }));
    return (Items || []).map((i) => safeUnmarshall<T>(i as AttrMap));
}

// ============================================================
// 🌐 Connection Table Helpers
// ============================================================

/** ✅ Query active connections by RoomId */
export async function queryByRoomId<T>(
    roomId: string,
    indexName = "RoomIdIndex"
): Promise<T[]> {
    const { Items } = await dynamo.send(
        new QueryCommand({
            TableName: ConnectionTableName,
            IndexName: indexName,
            KeyConditionExpression: "RoomId = :r",
            ExpressionAttributeValues: { ":r": { S: roomId } },
        })
    );
    return (Items || []).map((i) => safeUnmarshall<T>(i as AttrMap));
}

/** ✅ Update a connection’s associated RoomId (non-destructive) */
export async function updateRoomId(
    connectionId: string,
    roomId: string
): Promise<void> {
    await dynamo.send(
        new UpdateItemCommand({
            TableName: ConnectionTableName,
            Key: { ConnectionId: { S: connectionId } },
            UpdateExpression: "SET RoomId = :r",
            ExpressionAttributeValues: marshall({ ":r": roomId }),
        })
    );
}
