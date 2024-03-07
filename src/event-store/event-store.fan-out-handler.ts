import type { DynamoDBStreamEvent, DynamoDBStreamHandler } from "aws-lambda";
import { SNS } from "@aws-sdk/client-sns";

const { STREAMS_TOPIC_ARN } = process.env;
if (!STREAMS_TOPIC_ARN) {
	throw new Error("STREAMS_TOPIC_ARN is not defined");
}

const sns = new SNS();


interface Context {
	sns: SNS;
	streamsTopicArn: string;
}

export const handler: DynamoDBStreamHandler = async (event) => {
	return fanOut(event, { sns, streamsTopicArn: STREAMS_TOPIC_ARN });
};

export const fanOut = async (event: DynamoDBStreamEvent, ctx: Context) => {
	console.log("Processing transaction", JSON.stringify(event, undefined, "\t"));
	for (const record of event.Records) {
		console.log("Processing record", JSON.stringify(record, undefined, "\t"));
		if (record.eventName !== "INSERT" && record.eventName !== "MODIFY") {
			continue;
		}

		const transaction = record.dynamodb!.NewImage!;

		const streamId = transaction["streamId"]!.S!;
		const events = transaction["events"]!.L!;
		const initialRevision =
			1n + BigInt(transaction["revision"]!.N!) - BigInt(events.length);

		await ctx.sns.publishBatch({
			TopicArn: ctx.streamsTopicArn,
			PublishBatchRequestEntries: transaction["events"]!.L!.map(
				(event, eventIndex) => ({
					Id: event.M!["id"]!.S!,
					Message: event.M!["data"]!.S!,
					MessageGroupId: streamId,
					MessageDeduplicationId: event.M!["id"]!.S!,
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
				}),
			),
		});
	}
};
