bring http;
bring cloud;
bring ex;
bring "./handlers.w" as handlers;
bring dynamodb;
bring simtools;

let readStreamRoute = "/read-stream";
let appendStreamRoute = "/append-to-stream";
let streamIdAttribute = "streamId";
let revisionAttribute = "revision";
let vehicleAttribute = "vehicleId";

class CalendarService {
  pub table: dynamodb.Table;
  pub queue: cloud.Queue;

  new() {
    let calendarQueue = new cloud.Queue();
    let calendarTable = new dynamodb.Table(
      attributes: [
        { name: vehicleAttribute, type: "S" },
      ],
      hashKey: vehicleAttribute,
      name: "calendarServiceTable"
    );

    calendarQueue.setConsumer(inflight (event) => {
      handlers.calendarService(event, calendarTable.connection);
    });

    this.table = calendarTable;
    this.queue = calendarQueue;

    simtools.addMacro(this.table, "data", inflight () => {
      log(Json.stringify(this.table.scan().Items));
    });
  }
}

class StreamSequencer {
  pub table: dynamodb.Table;
  pub queue: cloud.Queue;

  new() {
    let streamsQueue = new cloud.Queue();
    let streamsTable = new dynamodb.Table(
      attributes: [
        { name: streamIdAttribute, type: "S" },
        { name: revisionAttribute, type: "N" }
      ],
      hashKey: streamIdAttribute,
      rangeKey: revisionAttribute,
    );

    streamsQueue.setConsumer(inflight (event) => {
      handlers.streamSequencer(event, streamsTable.connection);
    });

    this.table = streamsTable;
    this.queue = streamsQueue;
  }
}

class Topic extends cloud.Topic {
  new() {

  }

  pub connectToQueue(queue: cloud.Queue) {
    this.onMessage(inflight (event) => {
      queue.push(event);
    });
  }
}

let onTopicToSqs = inflight (event: str) => {
  let record: Json = unsafeCast(event);
  let queueRecord = MutJson{};
  let newAttributes = MutJson{};
  let attributes = record.get("MessageAttributes");
  for entry in Json.entries(attributes) {
    let attribute = MutJson{};
    for valueEntry in Json.entries(entry.value) {
      attribute.set("{valueEntry.key.at(0).lowercase()}{valueEntry.key.substring(1)}", valueEntry.value);  
    }
    newAttributes.set(entry.key, attribute);
  }
  queueRecord.set("messageAttributes", newAttributes);
  queueRecord.set("body", record.get("Message"));
  return queueRecord;
};

class EventStore {
  pub url: str;
  pub topic: cloud.Topic;

  new() {
    let api = new cloud.Api();
    this.url = api.url;

    let transactionsTable = new dynamodb.Table(
      name: "transactions_table",
      hashKey: streamIdAttribute,
      attributes: [ { name: streamIdAttribute, type: "S" } ],
    );

    let streams = new StreamSequencer();

    this.topic = new cloud.Topic();
    this.topic.onMessage(inflight (event) => {
      let record = onTopicToSqs(event);
      streams.queue.push(Json.stringify({ Records: [record] }));
    });

    transactionsTable.setStreamConsumer(inflight (record) => {
      handlers.eventStoreFanOut({ Records: [record] }, this.topic);
    });

    api.post(appendStreamRoute, inflight (req) => {
      log("append-to-stream: {req.body!}");
      return handlers.appendToStream(req, transactionsTable.connection);
    });

    api.post(readStreamRoute, inflight (req) => {
      log("read-stream: {req.body!}");
      return handlers.readStream(req, streams.table.connection);
    });
  }
}

let e = new EventStore();

let calendarService = new CalendarService();
e.topic.onMessage(inflight (event) => {
  let record = onTopicToSqs(event);
  calendarService.queue.push(Json.stringify({ Records: [record] }));
});

let appendToStreamFunction = new cloud.Function(inflight () => {
  let streamId = "my-stream-id";

  let appendResponse = http.post("{e.url}{appendStreamRoute}", body: Json.stringify({
    streamId: streamId,
    events: [
      { id: "e1", type: "my-type", data: { "vehicleId":"a", "vehicleName":"b", "assignedTo": "c" } },
    ]
  }));  
}) as "append_to_stream";

nodeof(appendToStreamFunction).title = "append to stream";

bring expect;

test "append and read to stream" {
  let streamId = "my-stream-id";

  let appendResponse = http.post("{e.url}{appendStreamRoute}", body: Json.stringify({
    streamId: streamId,
    events: [
      { id: "e1", type: "my-type", data: { foo: "bar" } },
      { id: "e2", type: "my-type", data: { foo: "bar" } }
    ]
  }));

  expect.equal(Json.parse(appendResponse.body), { 
    message: "Events appended to stream correctly",
    revision: "2"
  });

  let readResponse = http.post("{e.url}{readStreamRoute}", body: Json.stringify({
    streamId: streamId
  }));

  log(Json.stringify(Json.parse(readResponse.body)));
}
