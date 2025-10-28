// lib/dynamo.ts
import {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    QueryCommand,
    UpdateItemCommand,
    DeleteItemCommand,
    ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

// Create the DynamoDB client
export const dynamo = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

const TableName = process.env.DYNAMODB_TABLE_NAME!;

// ============================================================
// ✅ Basic Utilities
// ============================================================

/** Puts an item into DynamoDB (insert or replace). */
export async function putItem<T extends Record<string, any>>(item: T): Promise<void> {
    const params = {
        TableName,
        Item: marshall(item),
    };

    await dynamo.send(new PutItemCommand(params));
}

/** Gets a single item by PK + SK. */
export async function getItem<T = any>(pk: string, sk: string): Promise<T | null> {
    const params = {
        TableName,
        Key: marshall({ PK: pk, SK: sk }),
    };

    const { Item } = await dynamo.send(new GetItemCommand(params));
    return Item ? (unmarshall(Item) as T) : null;
}

/** Deletes an item by PK + SK. */
export async function deleteItem(pk: string, sk: string): Promise<void> {
    const params = {
        TableName,
        Key: marshall({ PK: pk, SK: sk }),
    };

    await dynamo.send(new DeleteItemCommand(params));
}

/** Queries all items in a partition (e.g. all users/stories in a room). */
export async function queryByPK<T = any>(pk: string): Promise<T[]> {
    const params = {
        TableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: marshall({
            ":pk": pk,
        }),
    };

    const { Items } = await dynamo.send(new QueryCommand(params));
    return (Items || []).map((i) => unmarshall(i) as T);
}

/** Queries by a given GSI. */
export async function queryByGSI<T = any>(
    indexName: string,
    keyName: string,
    keyValue: string
): Promise<T[]> {
    const params = {
        TableName,
        IndexName: indexName,
        KeyConditionExpression: `${keyName} = :v`,
        ExpressionAttributeValues: marshall({
            ":v": keyValue,
        }),
    };

    const { Items } = await dynamo.send(new QueryCommand(params));
    return (Items || []).map((i) => unmarshall(i) as T);
}

/** Performs a partial update on an item (e.g. updating story status). */
export async function updateItem(
    pk: string,
    sk: string,
    updates: Record<string, any>
): Promise<void> {
    const setExpressions: string[] = [];
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, any> = {};

    for (const [key, value] of Object.entries(updates)) {
        const nameKey = `#${key}`;
        const valKey = `:${key}`;
        setExpressions.push(`${nameKey} = ${valKey}`);
        exprNames[nameKey] = key;
        exprValues[valKey] = value;
    }

    const params = {
        TableName,
        Key: marshall({ PK: pk, SK: sk }),
        UpdateExpression: `SET ${setExpressions.join(", ")}`,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: marshall(exprValues),
    };

    await dynamo.send(new UpdateItemCommand(params));
}

/** Fetches all items (for testing/admin). Not for production scale use. */
export async function scanAll<T = any>(): Promise<T[]> {
    const params = { TableName };
    const { Items } = await dynamo.send(new ScanCommand(params));
    return (Items || []).map((i) => unmarshall(i) as T);
}
