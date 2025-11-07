import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
    console.log("onConnect event:", event);

    const connectionId = event.requestContext.connectionId;
    const roomId = event.queryStringParameters?.roomId ?? "lobby";

    await dynamo.send(
        new PutItemCommand({
            TableName: process.env.CONNECTIONS_TABLE,
            Item: {
                ConnectionId: { S: connectionId },
                RoomId: { S: roomId },
                ConnectedAt: { S: new Date().toISOString() },
            },
        })
    );

    return { statusCode: 200, body: "Connected." };
};
