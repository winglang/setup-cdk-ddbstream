import { Construct } from "constructs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import {
	DeduplicationScope,
	FifoThroughputLimit,
	Queue,
} from "aws-cdk-lib/aws-sqs";
import { TableV2, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export class StreamSequencer extends Construct {
	readonly transactionsQueue: Queue;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		const transactionsQueue = new Queue(this, "transactions-queue", {
			fifo: true,
			fifoThroughputLimit: FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
			deduplicationScope: DeduplicationScope.MESSAGE_GROUP,
			deadLetterQueue: {
				queue: new Queue(this, "dead-letter-queue", {
					fifo: true,
					fifoThroughputLimit: FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
					deduplicationScope: DeduplicationScope.MESSAGE_GROUP,
				}),
				maxReceiveCount: 3,
			},
		});

		const streamsTable = new TableV2(this, "streams-table", {
			partitionKey: { name: "streamId", type: AttributeType.STRING },
		});

		const sequencerHandler = new NodejsFunction(this, "handler", {
			entry: `${import.meta.dirname}/stream-sequencer.handler.ts`,
			bundling: {
				format: OutputFormat.ESM,
				// platform: "node",
				// target: "node20",
				mainFields: ["module", "main"],
			},
		});

		sequencerHandler.addEventSource(new SqsEventSource(transactionsQueue));

		sequencerHandler.addEnvironment("streamsTableName", streamsTable.tableName);
		streamsTable.grantReadWriteData(sequencerHandler);

		this.transactionsQueue = transactionsQueue;
	}
}
