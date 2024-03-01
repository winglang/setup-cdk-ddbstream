import type { DynamoDBStreamHandler } from "aws-lambda";
import { SNS } from "@aws-sdk/client-sns";

const { TRANSACTIONS_TOPIC_ARN } = process.env;
if (!TRANSACTIONS_TOPIC_ARN) {
	throw new Error("TRANSACTIONS_TOPIC_ARN is not defined");
}

const sns = new SNS();

export const handler: DynamoDBStreamHandler = async (event) => {
	console.log("Processing transaction", JSON.stringify(event, undefined, "\t"));
	for (const record of event.Records) {
		console.log("Processing record", JSON.stringify(record, undefined, "\t"));
		const streamId = record.dynamodb?.NewImage?.["streamId"]?.S;
		const transactionId = record.dynamodb?.NewImage?.["transactionId"]?.S;
		console.log({ streamId, transactionId });
		await sns.publish({
			TopicArn: TRANSACTIONS_TOPIC_ARN,
			Message: JSON.stringify(record.dynamodb?.NewImage),
			MessageDeduplicationId: transactionId,
			MessageGroupId: streamId,
		});
	}
};
