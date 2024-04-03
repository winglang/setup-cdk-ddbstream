import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import * as z from "zod";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { nanoid36 } from "../nanoid.js";
import type extern from "./api.append-to-stream-handler.extern";

const { TRANSACTIONS_TABLE_NAME } = process.env;

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
	// transactionId: z.string().optional(),
	expectedRevision: z
		.union([
			z.literal("any"),
			z.literal("noStream"),
			z.literal("streamExists"),
			z.bigint().positive(),
		])
		.optional(),
	events: z
		.array(
			z.object({
				id: z.string().optional(),
				type: z.string(),
				data: z.record(z.unknown()).optional(),
			}),
		)
		.nonempty(),
});

const dynamodb = new DynamoDB();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
	return main(event, { 
		dynamodb: dynamodb,
		tableName: TRANSACTIONS_TABLE_NAME!
	});
}

export const appendToStream: extern["appendToStream"] = async (event, transactionsTable) => {
	const r = await main(event as any, {
		dynamodb: new DynamoDB(transactionsTable.clientConfig!),
		tableName: transactionsTable.tableName
	});

	if (typeof(r) === "string") {
		return { body: r };
	}

	return {
		body: r.body,
		statusCode: r.statusCode,
		headers: r.headers as any,
		status: r.statusCode,
	};
};

const main = async (event: APIGatewayProxyEventV2, ctx: { dynamodb: DynamoDB, tableName: string }): Promise<APIGatewayProxyResultV2> => {
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

	// const transactionId = input.data.transactionId ?? `transaction_${nanoid36()}`;
	const timestamp = new Date().getTime();
	const expectedRevision = input.data.expectedRevision ?? "any";

	try {
		const { Attributes } = await ctx.dynamodb.updateItem({
			TableName: ctx.tableName,
			Key: {
				streamId: { S: input.data.streamId },
			},
			UpdateExpression:
				"SET #events = :events, #timestamp = :timestamp ADD #revision :totalNewEvents",
			ConditionExpression:
				"(:expectsNoStream = :true and attribute_not_exists(#streamId)) or (:expectsAny = :true) or (:expectsStreamExists = :true and attribute_exists(#streamId)) or (#revision = :expectedRevision)",
			ExpressionAttributeNames: {
				"#streamId": "streamId",
				"#events": "events",
				"#timestamp": "timestamp",
				"#revision": "revision",
			},
			ExpressionAttributeValues: {
				":events": {
					L: input.data.events.map((event) => {
						return {
							M: {
								id: {
									S: event.id ?? nanoid36(),
								},
								type: { S: event.type },
								data: {
									S: JSON.stringify(event.data ?? {}),
								},
							},
						};
					}),
				},
				":timestamp": { N: `${timestamp}` },
				":totalNewEvents": {
					N: input.data.events.length.toString(),
				},
				":true": { BOOL: true },
				":expectedRevision": {
					N:
						expectedRevision === "any" ||
						expectedRevision === "noStream" ||
						expectedRevision === "streamExists"
							? "0"
							: expectedRevision.toString(),
				},
				":expectsNoStream": {
					BOOL: expectedRevision === "noStream",
				},
				":expectsAny": {
					BOOL: expectedRevision === "any",
				},
				":expectsStreamExists": {
					BOOL: expectedRevision === "streamExists",
				},
			},
			ReturnValues: "UPDATED_NEW",
		});

		return {
			statusCode: 200,
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				message: "Events appended to stream correctly",
				revision: Attributes?.["revision"]?.N,
			}),
		};
	} catch (error) {
		return {
			statusCode: 400,
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				message: "Error appending events to stream",
				error: error instanceof Error ? error.message : error,
			}),
		};
	}
};
