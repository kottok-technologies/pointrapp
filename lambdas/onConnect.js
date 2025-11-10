const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const {ApiGatewayManagementApiClient} = require("@aws-sdk/client-apigatewaymanagementapi");

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log("onConnect event:", JSON.stringify(event, null, 2));

    try {
        const connectionId = event.requestContext.connectionId;
        const domain = event.requestContext.domainName;
        const stage = event.requestContext.stage;

        // Store connection
        await dynamo.send(
            new PutItemCommand({
                TableName: process.env.CONNECTIONS_TABLE,
                Item: marshall({
                    ConnectionId: connectionId,
                    DomainName: domain,
                    Stage: stage,
                    ConnectedAt: new Date().toISOString(),
                }),
            })
        );

        // Send a message back to the newly connected client
        const api = new ApiGatewayManagementApiClient({
            endpoint: `https://${domain}/${stage}`,
        });

        await api.send(
            new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify({
                    type: "connection_ack",
                    connectionId,
                }),
            })
        );

        // ✅ Must return 200
        return {
            statusCode: 200,
            body: "Connected successfully.",
        };
    } catch (err) {
        console.error("❌ Connect error:", err);

        // ❗ Even on error, return 200 or it becomes "Forbidden"
        return {
            statusCode: 200,
            body: `Connected (with warning): ${err.message}`,
        };
    }
};
