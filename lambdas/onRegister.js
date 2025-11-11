const {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");

exports.handler = async (event) => {
    const { connectionId, domainName, stage } = event.requestContext;

    const payload = JSON.stringify({
        type: "connectionAck",
        connectionId, // ✅ Send it back to client
    });

    const api = new ApiGatewayManagementApiClient({
        region: process.env.AWS_REGION,
        endpoint: `https://${domainName}/${stage}`,
    });

    await api.send(
        new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: payload,
        })
    );

    return { statusCode: 200 };
};
