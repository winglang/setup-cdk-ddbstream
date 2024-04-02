import { eventNames } from "process";
import type extern from "./handler.extern";

export const calendarService: extern["calendarService"] = async (event, bucket) => {
	for (let record of event["Records"]) {
		const filename = `${record.messageAttributes.eventType.stringValue}/${record.messageAttributes.revision.stringValue}.json`;
		console.log(`saving file name ${filename}`);
		bucket.put(filename, record.body);

	}
}
