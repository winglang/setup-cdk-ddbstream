import type { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";
import { SNS } from "@aws-sdk/client-sns";

interface Context {
	sns: SNS;
	streamsTopicArn: string;
}

export const handler: DynamoDBStreamHandler = async (event) => {
	const { STREAMS_TOPIC_ARN } = process.env;
	if (!STREAMS_TOPIC_ARN) {
		throw new Error("STREAMS_TOPIC_ARN is not defined");
	}

	main(event, { sns: new SNS(), streamsTopicArn: STREAMS_TOPIC_ARN });
};

export const eventStoreFanOut = async (event: any, sns: SNS) => {
	main(event, { sns, streamsTopicArn: "" })
};

const main = async (event: DynamoDBStreamEvent, ctx: Context) => {
	// console.log("Processing transaction", JSON.stringify(event, undefined, "\t"));
	for (const record of event.Records) {
		// console.log("Processing record", JSON.stringify(record, undefined, "\t"));
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

			await ctx.sns.publish({
				Id: event.M!["id"]!.S!,
				TopicArn: ctx.streamsTopicArn,
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
