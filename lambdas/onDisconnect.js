import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
    console.log("onDisconnect event:", event);

    const connectionId = event.requestContext.connectionId;

    await dynamo.send(
        new DeleteItemCommand({
            TableName: process.env.CONNECTIONS_TABLE,
            Key: { ConnectionId: { S: connectionId } },
        })
    );

    return { statusCode: 200, body: "Disconnected." };
};
