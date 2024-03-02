import type { SQSHandler } from "aws-lambda";

export const handler: SQSHandler = async (event) => {
	console.log("Processing transaction", JSON.stringify(event, undefined, "\t"));
	for (const record of event.Records) {
		console.log("Processing record", JSON.stringify(record, undefined, "\t"));
		// const streamId = record.messageAttributes?.streamId.stringValue;
		// const transactionId = record.messageAttributes?.transactionId.stringValue;
		// const revision = record.messageAttributes?.revision.stringValue;
		// console.log({ streamId, transactionId, revision });
		console.log(JSON.parse(record.body));
	}
};
