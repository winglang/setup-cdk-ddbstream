import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
	console.log("Received event", JSON.stringify(event, undefined, "\t"));
	return {
		statusCode: 200,
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ message: "Hello, World!" }),
	};
};
