import { Construct } from "constructs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
import {
	TableV2,
	AttributeType,
	StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { StreamSequencer } from "./stream-sequencer.js";

export class EventStore extends Construct {
	readonly transactionsTopic: Topic;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		const transactionsTable = new TableV2(this, "transactions-table", {
			partitionKey: { name: "streamId", type: AttributeType.STRING },
			dynamoStream: StreamViewType.NEW_IMAGE,
		});

		const fanOutHandler = new NodejsFunction(this, "fan-out-handler", {
			entry: `${import.meta.dirname}/event-store.fan-out-handler.ts`,
			bundling: {
				format: OutputFormat.ESM,
				// platform: "node",
				// target: "node20",
				mainFields: ["module", "main"],
				externalModules: ["aws-lambda"],
			},
		});

		const transactionsTopic = new Topic(this, "transactions-topic", {
			fifo: true,
		});

		fanOutHandler.addEventSource(
			new DynamoEventSource(transactionsTable, {
				startingPosition: StartingPosition.TRIM_HORIZON,
			}),
		);

		fanOutHandler.addEnvironment(
			"TRANSACTIONS_TOPIC_ARN",
			transactionsTopic.topicArn,
		);
		transactionsTopic.grantPublish(fanOutHandler);

		const streamSequencer = new StreamSequencer(this, "stream-sequencer");
		transactionsTopic.addSubscription(
			new SqsSubscription(streamSequencer.transactionsQueue),
		);

		this.transactionsTopic = transactionsTopic;
	}
}
