import { Construct } from "constructs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
import {
	HttpApi,
	HttpMethod,
	type IHttpApi,
} from "aws-cdk-lib/aws-apigatewayv2";
import {
	TableV2,
	AttributeType,
	StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic, type ITopic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { StreamSequencer } from "./stream-sequencer.js";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Api } from "./api.js";

export class EventStore extends Construct {
	readonly transactionsTopic: ITopic;
	readonly httpApi: IHttpApi;

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
			new SqsSubscription(streamSequencer.transactionsQueue, {
				rawMessageDelivery: true,
			}),
		);

		const api = new Api(this, "api", {
			transactionsTable,
			streamsTable: streamSequencer.streamsTable,
		});

		this.transactionsTopic = transactionsTopic;
		this.httpApi = api.httpApi;
	}
}
