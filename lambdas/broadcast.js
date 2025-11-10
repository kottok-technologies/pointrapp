const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const  {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
    console.log("broadcast event:", event);

    const body = JSON.parse(event.body ?? "{}");
    const { roomId, type, data } = body;

    // Fetch all connections for this room
    const { Items } = await dynamo.send(
        new QueryCommand({
            TableName: process.env.CONNECTIONS_TABLE,
            IndexName: "RoomIdIndex",
            KeyConditionExpression: "RoomId = :r",
            ExpressionAttributeValues: { ":r": { S: roomId } },
        })
    );

    // Gateway client for posting messages
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const api = new ApiGatewayManagementApiClient({
        region: process.env.AWS_REGION,
        endpoint: `https://${domain}/${stage}`,
    });

    const message = JSON.stringify({ type, data });

    for (const item of Items ?? []) {
        const connectionId = item.ConnectionId.S;
        try {
            await api.send(
                new PostToConnectionCommand({
                    ConnectionId: connectionId,
                    Data: message,
                })
            );
        } catch (err) {
            console.error(`Failed to post to ${connectionId}:`, err);
        }
    }

    return { statusCode: 200, body: "Broadcast complete" };
};
