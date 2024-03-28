import type { DynamoDBStreamHandler } from "aws-lambda";
import { SNS } from "@aws-sdk/client-sns";

const { STREAMS_TOPIC_ARN } = process.env;
if (!STREAMS_TOPIC_ARN) {
	throw new Error("STREAMS_TOPIC_ARN is not defined");
}

const sns = new SNS();

export const handler: DynamoDBStreamHandler = async (event) => {
	console.log("Processing transaction", JSON.stringify(event, undefined, "\t"));
	for (const record of event.Records) {
		console.log("Processing record", JSON.stringify(record, undefined, "\t"));
		if (record.eventName !== "INSERT" && record.eventName !== "MODIFY") {
			continue;
		}

		const transaction = record.dynamodb!.NewImage!;

		const streamId = transaction["streamId"]!.S!;
		const events = transaction["events"]!.L!;
		const initialRevision = 1n + BigInt(transaction["revision"]!.N!) - BigInt(events.length);

		for (const [eventIndex, event] of events.entries()) {
			await sns.publish({
				TopicArn: STREAMS_TOPIC_ARN,
				Message: JSON.stringify({
					id: event.M!["id"]!.S!,
					data: event.M!["data"]!.S!,
					type: event.M!["type"]!.S!,
					streamId: streamId,
					revision: (initialRevision + BigInt(eventIndex)).toString(),
					timestamp: transaction["timestamp"]!.N!,
				}),
				MessageAttributes: {
					eventId: {
						DataType: "String",
						StringValue: event.M!["id"]!.S!,
					},
					eventType: {
						DataType: "String",
						StringValue: event.M!["type"]!.S!,
					},
					streamId: {
						DataType: "String",
						StringValue: streamId,
					},
					revision: {
						DataType: "Number",
						StringValue: (initialRevision + BigInt(eventIndex)).toString(),
					},
					timestamp: {
						DataType: "Number",
						StringValue: transaction["timestamp"]!.N!,
					},
				},
			});
		}
	}
};
