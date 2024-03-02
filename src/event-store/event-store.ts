import { Construct } from "constructs";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
import { type IHttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import {
	TableV2,
	AttributeType,
	StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic, type ITopic } from "aws-cdk-lib/aws-sns";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { StreamSequencer } from "./stream-sequencer.js";
import { Api } from "./api.js";

export class EventStore extends Construct {
	readonly streamsTopic: ITopic;
	readonly httpApi: IHttpApi;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		const transactionsTable = new TableV2(this, "TransactionsTable", {
			partitionKey: { name: "streamId", type: AttributeType.STRING },
			dynamoStream: StreamViewType.NEW_IMAGE,
		});

		const fanOutHandler = new NodejsFunction(this, "FanOutHandler", {
			entry: `${import.meta.dirname}/event-store.fan-out-handler.ts`,
			bundling: {
				format: OutputFormat.ESM,
				// platform: "node",
				// target: "node20",
				mainFields: ["module", "main"],
			},
		});

		const streamsTopic = new Topic(this, "StreamsTopic", {
			fifo: true,
		});

		fanOutHandler.addEventSource(
			new DynamoEventSource(transactionsTable, {
				startingPosition: StartingPosition.TRIM_HORIZON,
			}),
		);

		fanOutHandler.addEnvironment("STREAMS_TOPIC_ARN", streamsTopic.topicArn);
		streamsTopic.grantPublish(fanOutHandler);

		const streamSequencer = new StreamSequencer(this, "StreamSequencer");
		streamsTopic.addSubscription(
			new SqsSubscription(streamSequencer.streamsQueue, {
				rawMessageDelivery: true,
			}),
		);

		const api = new Api(this, "Api", {
			transactionsTable,
			streamsTable: streamSequencer.streamsTable,
		});

		this.streamsTopic = streamsTopic;
		this.httpApi = api.httpApi;
	}
}
