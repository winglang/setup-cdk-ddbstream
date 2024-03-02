import type { SQSHandler } from "aws-lambda";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const { STREAMS_TABLE_NAME } = process.env;
const dynamodb = new DynamoDB();

export const handler: SQSHandler = async (event) => {
	console.log("Processing transaction", JSON.stringify(event, undefined, "\t"));
	await dynamodb.batchWriteItem({
		RequestItems: {
			[STREAMS_TABLE_NAME!]: event.Records.map((record) => ({
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
