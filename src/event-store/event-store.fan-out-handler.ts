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
			const messageId = event.M!["id"]!.S!;
			const messageDeduplicationId = messageId; // Assuming 'id' is unique for deduplication
			const revision = (initialRevision + BigInt(eventIndex)).toString();

			await sns.publish({
				Id: event.M!["id"]!.S!,
				TopicArn: STREAMS_TOPIC_ARN,
				Message: event.M!["data"]!.S!,
				MessageGroupId: streamId, // Required for FIFO topics
				MessageDeduplicationId: messageDeduplicationId, // Optional if SNS can use content-based deduplication
				MessageAttributes: {
					eventId: {
						DataType: "String",
						StringValue: messageId,
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
						StringValue: revision,
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
