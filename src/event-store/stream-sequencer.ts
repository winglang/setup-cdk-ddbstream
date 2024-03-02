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
	readonly streamsQueue: Queue;

	readonly streamsTable: TableV2;

	constructor(scope: Construct, id: string) {
		super(scope, id);

		const streamsQueue = new Queue(this, "StreamsQueue", {
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

		const streamsTable = new TableV2(this, "StreamsTable", {
			partitionKey: { name: "streamId", type: AttributeType.STRING },
			sortKey: { name: "revision", type: AttributeType.NUMBER },
		});

		const sequencerHandler = new NodejsFunction(this, "Handler", {
			entry: `${import.meta.dirname}/stream-sequencer.handler.ts`,
			bundling: {
				format: OutputFormat.ESM,
				// platform: "node",
				// target: "node20",
				mainFields: ["module", "main"],
			},
		});

		sequencerHandler.addEventSource(new SqsEventSource(streamsQueue));

		sequencerHandler.addEnvironment(
			"STREAMS_TABLE_NAME",
			streamsTable.tableName,
		);
		streamsTable.grantReadWriteData(sequencerHandler);

		this.streamsQueue = streamsQueue;
		this.streamsTable = streamsTable;
	}
}
