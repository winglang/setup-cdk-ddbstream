import type { SQSHandler } from "aws-lambda";

export const handler: SQSHandler = async (event) => {
	console.log("Processing transaction", JSON.stringify(event, undefined, "\t"));
};
