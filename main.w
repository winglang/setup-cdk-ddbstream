bring http;
bring cloud;
bring simtools;
bring expect;
bring util;
bring "./src/wing/optibus.w" as optibus;


class CalendarService extends optibus.ClientService {
	pub storage: cloud.Bucket;

	pub extern "./src/calendar-service/handler.ts" static inflight calendarService(event: Json, storage: cloud.Bucket): void;

  new() {
		this.storage = new cloud.Bucket();
    this.queue.setConsumer(inflight (event) => {
			CalendarService.calendarService(Json.parse(event), this.storage);
			});
		}
	}


	let route = "/append-to-stream";
	let eventStore = new optibus.EventStore(
		appendStreamRoute: route,
		streamIdAttribute: "streamId",
		revisionAttribute: "revision"
		);

		let calendarService = new CalendarService();
		eventStore.subscribeQueue(calendarService.queue);

		let event = Json.stringify({
			streamId: "my-stream-id",
    events: [
      { id: "e1", type: "t1", data: { "vehicleId":"a1", "vehicleName":"b1", "assignedTo": "c1" } },
			{ id: "e2", type: "t2", data: { "and":"now", "for":"something", "complexly": "different" } },
			{ id: "e3", type: "t1", data: { "vehicleId":"a2", "vehicleName":"b2", "assignedTo": "c2" } },
    ]
  });
log(event);
test "data is stored on bucket" {
  let appendResponse = http.post("{eventStore.url}{route}", body: event);
	expect.equal({
		"message": "Events appended to stream correctly",
		"revision": "3"
	}, Json.parse(appendResponse.body));

	util.waitUntil(() => {
		return calendarService.storage.list().length == 3;
	});

	expect.equal({ "vehicleId":"a1", "vehicleName":"b1", "assignedTo": "c1" }, calendarService.storage.getJson("t1/1.json"));
	expect.equal({ "vehicleId":"a2", "vehicleName":"b2", "assignedTo": "c2" }, calendarService.storage.getJson("t1/3.json"));
	expect.equal({ "and":"now", "for":"something", "complexly": "different" }, calendarService.storage.getJson("t2/2.json"));
}


simtools.addMacro(eventStore, "append to stream", inflight () => {
  http.post("{eventStore.url}{appendStreamRoute}", body: event);
});
