import { Stack, type StackProps } from "aws-cdk-lib";
import { type Construct } from "constructs";
import { CalendarService } from "./calendar-service.js";
import type { EventStore } from "../event-store/event-store.js";

export interface CalendarServiceStackProps extends StackProps {
	eventStore: EventStore;
}

export class CalendarServiceStack extends Stack {
	constructor(scope: Construct, id: string, props: CalendarServiceStackProps) {
		super(scope, id, props);

		new CalendarService(this, "CalendarService", {
			eventStore: props.eventStore,
		});
	}
}
