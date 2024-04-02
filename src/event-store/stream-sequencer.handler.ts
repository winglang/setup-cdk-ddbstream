import type { SQSBatchResponse, SQSEvent, SQSHandler } from "aws-lambda";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import type extern from "./stream-sequencer.handler.extern";

const { STREAMS_TABLE_NAME } = process.env;
const dynamodb = new DynamoDB();

export const handler: SQSHandler = async(event) => {
	return main(event, { dynamodb, tableName: STREAMS_TABLE_NAME! });
};

export const streamSequencer: extern["streamSequencer"] = async (event, table) => {
	await main(JSON.parse(event) as SQSEvent, {
		dynamodb: new DynamoDB(table.clientConfig!),
		tableName: table.tableName,
	});
};

const main = async (event: SQSEvent, ctx: { dynamodb: DynamoDB, tableName: string }) => {
	// console.log("Processing event", JSON.stringify(event, undefined, "\t"));
	await ctx.dynamodb.batchWriteItem({
		RequestItems: {
			[ctx.tableName]: event.Records.map((record) => ({
				PutRequest: {
					Item: {
						streamId: { S: record.messageAttributes["streamId"]!.stringValue! },
						revision: { N: record.messageAttributes["revision"]!.stringValue! },
						eventId: { S: record.messageAttributes["eventId"]!.stringValue! },
						timestamp: {
							N: record.messageAttributes["timestamp"]!.stringValue!,
						},
						event: { S: record.body },
					},
				},
			})),
		},
	});
};
