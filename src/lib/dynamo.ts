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
// DynamoDB Client Setup
// ============================================================

const isLocalhost =
    process.env.HOSTNAME === "localhost" || process.env.HOST === "localhost" || process.env.NODE_ENV === "development";

// Dynamically configure the client based on the environment
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
        // default credentials chain
    });
};

const dynamo = getDynamoClient();

const TableName = process.env.DYNAMODB_TABLE_NAME!;
if (!TableName)
    throw new Error("❌ Missing DYNAMODB_TABLE_NAME env variable");
/**
 * Converts PascalCase or snake_case keys to camelCase recursively.
 */
function toCamelCaseKeys<T>(obj: unknown): T {
    if (Array.isArray(obj)) {
        // Recursively process each array element
        return obj.map((item) => toCamelCaseKeys(item)) as unknown as T;
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

/**
 * Converts camelCase keys to PascalCase recursively.
 */
function toPascalCaseKeys<T>(obj: unknown): T {
    if (Array.isArray(obj)) {
        return obj.map((item) => toPascalCaseKeys(item)) as unknown as T;
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
// Utility Helpers
// ============================================================

/** Helper for marshalling values safely (returns AttrMap). */
function safeMarshall<T extends object>(obj: T): AttrMap {
    const pascalized = toPascalCaseKeys(obj); // ✅ convert to PascalCase before saving
    return marshall(pascalized, { removeUndefinedValues: true }) as AttrMap;
}

/** Helper for unmarshalling values safely (accepts AttrMap). */
function safeUnmarshall<T>(item: AttrMap): T {
    const raw = unmarshall(item);
    return toCamelCaseKeys<T>(raw); // ✅ convert Dynamo keys to camelCase
}

// ============================================================
// CRUD Utilities
// ============================================================

/** Inserts or replaces an item in DynamoDB. */
export async function putItem<T extends object>(item: T): Promise<void> {
    const params = {
        TableName,
        Item: safeMarshall(item),
    };
    await dynamo.send(new PutItemCommand(params));
}

/** Retrieves a single item by PK + SK. */
export async function getItem<T>(
    pk: string,
    sk: string
): Promise<T | null> {
    const params = {
        TableName,
        Key: safeMarshall({ PK: pk, SK: sk }),
    };

    const { Item } = await dynamo.send(new GetItemCommand(params));
    return Item ? safeUnmarshall<T>(Item as AttrMap) : null;
}

/** Deletes an item by PK + SK. */
export async function deleteItem(pk: string, sk: string): Promise<void> {
    const params = {
        TableName,
        Key: safeMarshall({ PK: pk, SK: sk }),
    };
    await dynamo.send(new DeleteItemCommand(params));
}

/** Queries all items in a partition (e.g., all users/stories in a room). */
export async function queryByPK<T>(pk: string): Promise<T[]> {
    const params = {
        TableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: safeMarshall({ ":pk": pk }),
    };

    const { Items } = await dynamo.send(new QueryCommand(params));
    return (Items || []).map((i) => safeUnmarshall<T>(i as AttrMap));
}

/** Queries by a Global Secondary Index (GSI). */
export async function queryByGSI<T>(
    indexName: string,
    keyName: string,
    keyValue: string
): Promise<T[]> {
    const params = {
        TableName,
        IndexName: indexName,
        KeyConditionExpression: `${keyName} = :v`,
        ExpressionAttributeValues: safeMarshall({ ":v": keyValue }),
    };

    const { Items } = await dynamo.send(new QueryCommand(params));
    return (Items || []).map((i) => safeUnmarshall<T>(i as AttrMap));
}

/** Performs a partial update on an item (e.g., updating story status). */
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

    const params = {
        TableName,
        Key: safeMarshall({ PK: pk, SK: sk }),
        UpdateExpression: `SET ${setExpressions.join(", ")}`,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: safeMarshall(exprValues),
    };

    await dynamo.send(new UpdateItemCommand(params));
}

/** Scans all items in the table. ⚠️ For testing/admin only. */
export async function scanAll<T>(): Promise<T[]> {
    const params = { TableName };
    const { Items } = await dynamo.send(new ScanCommand(params));
    return (Items || []).map((i) => safeUnmarshall<T>(i as AttrMap));
}
