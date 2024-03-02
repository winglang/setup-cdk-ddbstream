import * as cdk from "aws-cdk-lib";
import { EventStoreStack } from "./event-store/event-store-stack.js";
import { CalendarServiceStack } from "./calendar-service/calendar-service-stack.js";

const app = new cdk.App();

const eventStoreStack = new EventStoreStack(app, "EventStoreStack", {
	env: {
		account: process.env["CDK_DEFAULT_ACCOUNT"],
		region: process.env["CDK_DEFAULT_REGION"],
	},
});

new cdk.CfnOutput(eventStoreStack, "ApiEndpoint", {
	value: eventStoreStack.eventStore.httpApi.apiEndpoint,
});

new CalendarServiceStack(app, "CalendarServiceStack", {
	eventStore: eventStoreStack.eventStore,
	env: {
		account: process.env["CDK_DEFAULT_ACCOUNT"],
		region: process.env["CDK_DEFAULT_REGION"],
	},
});
