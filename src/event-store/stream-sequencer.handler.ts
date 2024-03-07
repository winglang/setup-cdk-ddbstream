import type { SQSEvent, SQSHandler } from "aws-lambda";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const { STREAMS_TABLE_NAME } = process.env;
const dynamodb = new DynamoDB();

interface Context {
	streamTableName: string;
	dynamodb: DynamoDB;
}

export const handler: SQSHandler = async (event) => {
	return streamSequencer(event, {
		streamTableName: STREAMS_TABLE_NAME!,
		dynamodb,
	});
};

export const streamSequencer = async (event: SQSEvent, ctx: Context) => {
	console.log("Processing event", JSON.stringify(event, undefined, "\t"));
	await ctx.dynamodb.batchWriteItem({
		RequestItems: {
			[ctx.streamTableName]: event.Records.map((record) => ({
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
