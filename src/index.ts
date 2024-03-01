import * as cdk from "aws-cdk-lib";
import { EventStoreStack } from "./event-store/event-store-stack.js";

const app = new cdk.App();

const eventStoreStack = new EventStoreStack(app, "EventStoreStack", {
	env: {
		account: process.env["CDK_DEFAULT_ACCOUNT"],
		region: process.env["CDK_DEFAULT_REGION"],
	},
});
