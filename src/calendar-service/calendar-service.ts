import { Construct } from "constructs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { TableV2, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import type { EventStore } from "../event-store/event-store.js";
import {
	DeduplicationScope,
	FifoThroughputLimit,
	Queue,
} from "aws-cdk-lib/aws-sqs";
import { SubscriptionFilter } from "aws-cdk-lib/aws-sns";

export interface CalendarServiceProps {
	eventStore: EventStore;
}

export class CalendarService extends Construct {
	constructor(scope: Construct, id: string, props: CalendarServiceProps) {
		super(scope, id);

		const queue = new Queue(this, "Queue", {
			fifo: true,
			fifoThroughputLimit: FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
			deduplicationScope: DeduplicationScope.MESSAGE_GROUP,
			deadLetterQueue: {
				queue: new Queue(this, "DeadLetterQueue", {
					fifo: true,
					fifoThroughputLimit: FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
					deduplicationScope: DeduplicationScope.MESSAGE_GROUP,
				}),
				maxReceiveCount: 3,
			},
		});

		const table = new TableV2(this, "Table", {
			partitionKey: { name: "vehicleId", type: AttributeType.STRING },
		});

		const handler = new NodejsFunction(this, "Handler", {
			entry: `${import.meta.dirname}/calendar-service.handler.ts`,
			bundling: {
				format: OutputFormat.ESM,
				// platform: "node",
				// target: "node20",
				mainFields: ["module", "main"],
			},
		});

		handler.addEventSource(new SqsEventSource(queue));

		handler.addEnvironment("TABLE_NAME", table.tableName);
		table.grantReadWriteData(handler);

		props.eventStore.streamsTopic.addSubscription(
			new SqsSubscription(queue, {
				rawMessageDelivery: true,
				filterPolicy: {
					eventType: SubscriptionFilter.stringFilter({
						allowlist: ["vehicleAssigned"],
					}),
				},
			}),
		);
	}
}
