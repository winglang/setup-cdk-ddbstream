bring cloud;
bring ex;
bring "./handlers.w" as handlers;
bring dynamodb;

class StreamSequencer {
  pub table: dynamodb.Table;
  pub queue: cloud.Queue;

  new() {
    let streamIdAttribute = "streamId";
    let revisionAttribute = "revision";
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
      handlers.streamSequencer(event, streamsTable: streamsTable);
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

    let streamId = "streamId";

    let transactionsTable = new dynamodb.Table(
      name: "transactions_table",
      hashKey: streamId,
      attributes: [ { name: streamId, type: "S" } ],
    );

    let streams = new StreamSequencer();
    let streamsTopic = new Topic() as "streams_topic";

    transactionsTable.setStreamConsumer(inflight (record) => {
      // handlers.fanout(event, );
      log("new record");
    });

    streamsTopic.connectToQueue(streams.queue);

    api.post("/append-to-stream", inflight (req) => {
      log("append-to-stream: {req.body!}");
      return handlers.appendToStream(req, transactionsTable: transactionsTable);
    });

    api.post("/read-stream", inflight (req) => {
      log("read-stream: {req.body!}");
      return handlers.readStream(req, streamsTable: streams.table);
    });
  }
}

let e = new EventStore();

bring http;
bring expect;

let makeTest = (title: str, fn: inflight (str?): str?) => {
  new cloud.Function(fn) as title;
  new std.Test(fn) as "test: {title}";
};

makeTest("append to stream", inflight () => {
  let response = http.post("{e.url}/append-to-stream", body: Json.stringify({
    streamId: "hello",
    events: [
      { id: "e1", type: "my-type", data: { foo: "bar" } },
      { id: "e2", type: "my-type", data: { foo: "bar" } }
    ]
  }));

  log(response.body);
  log("{response.status}");
});

makeTest("read stream", inflight () => {
  let response = http.post("{e.url}/read-stream", body: Json.stringify({
    streamId: "hello"
  }));

  log(Json.stringify(Json.parse(response.body)));
});
