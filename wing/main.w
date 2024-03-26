bring http;
bring cloud;
bring ex;
bring "./handlers.w" as handlers;
bring dynamodb;

let readStreamRoute = "/read-stream";
let appendStreamRoute = "/append-to-stream";
let streamIdAttribute = "streamId";
let revisionAttribute = "revision";

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

class EventStore {
  pub url: str;

  new() {
    let api = new cloud.Api();
    this.url = api.url;

    let transactionsTable = new dynamodb.Table(
      name: "transactions_table",
      hashKey: streamIdAttribute,
      attributes: [ { name: streamIdAttribute, type: "S" } ],
    );

    let streams = new StreamSequencer();

    transactionsTable.setStreamConsumer(inflight (record) => {
      log(Json.stringify(record));
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

let appendToStreamFunction = new cloud.Function(inflight () => {
  let streamId = "my-stream-id";

  let appendResponse = http.post("{e.url}{appendStreamRoute}", body: Json.stringify({
    streamId: streamId,
    events: [
      { id: "e1", type: "my-type", data: { foo: "bar" } },
      { id: "e2", type: "my-type", data: { foo: "bar" } }
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
