import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from "aws-lambda";
import * as z from "zod";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const { STREAMS_TABLE_NAME } = process.env;

const stringToJSONSchema = z.string().transform((str, ctx): unknown => {
	try {
		return JSON.parse(str);
	} catch (e) {
		ctx.addIssue({ code: "custom", message: "Invalid JSON" });
		return z.NEVER;
	}
});

const inputSchema = z.object({
	streamId: z.string(),
	fromRevision: z.union([z.literal("start"), z.bigint().positive()]).optional(),
	maxCount: z.number().int().positive().optional(),
	eventTypes: z.array(z.string()).optional(),
	direction: z
		.union([z.literal("forwards"), z.literal("backwards")])
		.optional(),
});

const dynamodb = new DynamoDB();

interface Context {
	dynamodb: DynamoDB;
	streamsTableName: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
	return readStream(event, { dynamodb, streamsTableName: STREAMS_TABLE_NAME! });
}

export const readStream = async (event: APIGatewayProxyEventV2, ctx: Context): Promise<APIGatewayProxyResultV2> => {
	const input = await stringToJSONSchema
		.pipe(inputSchema)
		.safeParseAsync(event.body);
	if (!input.success) {
		return {
			statusCode: 422,
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				// message: input.error.message,
				errors: input.error.issues,
			}),
		};
	}

	const eventTypes = input.data.eventTypes ?? [];

	const { Items } = await ctx.dynamodb.query({
		TableName: ctx.streamsTableName,
		KeyConditionExpression: "#streamId = :streamId",
		FilterExpression: ":allTypes = :true or contains(:types, #type)",
		ExpressionAttributeNames: {
			"#streamId": "streamId",
			"#type": "type",
		},
		ExpressionAttributeValues: {
			":streamId": { S: input.data.streamId },
			":types": {
				SS: eventTypes.length > 0 ? eventTypes : ["empty"],
			},
			":allTypes": { BOOL: eventTypes.length === 0 },
			":true": { BOOL: true },
		},
		ExclusiveStartKey:
			typeof input.data.fromRevision === "bigint"
				? {
						streamId: { S: input.data.streamId },
						revision: { N: input.data.fromRevision.toString() },
				  }
				: undefined,
		Limit: input.data.maxCount,
		ScanIndexForward:
			!input.data.direction || input.data.direction === "forwards",
	});

	return {
		statusCode: 200,
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({
			message: "",
			items: Items,
		}),
	};
};
