import { Stack, type StackProps } from "aws-cdk-lib";
import { type Construct } from "constructs";
import { EventStore } from "./event-store.js";

export class EventStoreStack extends Stack {
	readonly eventStore: EventStore;

	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		this.eventStore = new EventStore(this, "EventStore");
	}
}
