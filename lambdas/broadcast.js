const {
    DynamoDBClient,
    QueryCommand,
} = require("@aws-sdk/client-dynamodb");
const {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const dynamo = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
});

exports.handler = async (event) => {
    console.log("📡 Incoming broadcast event:", JSON.stringify(event, null, 2));

    try {
        const parsedBody = JSON.parse(event.body ?? "{}");
        const { roomId, type = "broadcast", data = {} } = parsedBody;

        if (!roomId) {
            console.error("❌ Missing roomId in broadcast event");
            return { statusCode: 400, body: "Missing roomId" };
        }

        const tableName = process.env.CONNECTIONS_TABLE;
        if (!tableName) {
            console.error("❌ CONNECTIONS_TABLE not set in environment");
            return { statusCode: 500, body: "Missing CONNECTIONS_TABLE" };
        }

        // 🧠 Query all connections for this room
        const queryParams = {
            TableName: tableName,
            IndexName: "RoomIdIndex",
            KeyConditionExpression: "RoomId = :roomId",
            ExpressionAttributeValues: marshall({
                ":roomId": roomId,
            }),
        };

        console.log("🔍 Querying connections with params:", queryParams);

        const queryResult = await dynamo.send(new QueryCommand(queryParams));
        const connections = (queryResult.Items || []).map((i) => unmarshall(i));

        console.log(`✅ Found ${connections.length} connections for room ${roomId}`);

        // 🛰️ Setup API Gateway client for sending messages
        const domain = event.requestContext.domainName;
        const stage = event.requestContext.stage;
        const api = new ApiGatewayManagementApiClient({
            region: process.env.AWS_REGION || "us-east-1",
            endpoint: `https://${domain}/${stage}`,
        });

        const payload = JSON.stringify({ type, data });
        let successCount = 0;
        let failCount = 0;

        for (const conn of connections) {
            const connectionId = conn.ConnectionId;
            if (!connectionId) continue;

            try {
                await api.send(
                    new PostToConnectionCommand({
                        ConnectionId: connectionId,
                        Data: payload,
                    })
                );
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`⚠️ Failed to send to ${connectionId}:`, err);
            }
        }

        console.log(`📤 Broadcast summary: ${successCount} sent, ${failCount} failed`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Broadcast complete for room ${roomId}`,
                sent: successCount,
                failed: failCount,
            }),
        };
    } catch (err) {
        console.error("💥 Broadcast handler error:", err);
        return { statusCode: 500, body: "Internal Server Error" };
    }
};
