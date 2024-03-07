bring cloud;
bring ex;
bring "./handlers.w" as handlers;
bring "./dynamo-table.w" as dynamodb;

class StreamSequencer {
  pub table: dynamodb.Table;
  pub queue: cloud.Queue;

  new() {
    let streamsQueue = new cloud.Queue();
    let streamsTable = new dynamodb.Table(
      name: "streams_table",
      hashKey: "streamId",
      rangeKey: "revision",
      attributeDefinitions: {
        streamId: "S",
        revision: "N"
      }
    );

    streamsQueue.setConsumer(inflight (event) => {
      handlers.streamSequencer(event, 
        streamsTableName: streamsTable.name,
        dynamodb: streamsTable.client(),
      );
    });

    this.table = streamsTable;
    this.queue = streamsQueue;
  }
}


class EventStore {
  pub url: str;

  new() {
    let api = new cloud.Api();
    this.url = api.url;

    let transactionsTable = new dynamodb.Table(
      name: "transactions_table",
      hashKey: "streamId",
      attributeDefinitions: {
        streamId: "S",
      },
    );

    let streams = new StreamSequencer();
    let streamsTopic = new cloud.Topic() as "streams_topic";

    transactionsTable.onEvent(inflight (event) => {
      streamsTopic.publish(event);
    });

    streamsTopic.onMessage(inflight (event) => {
      streams.queue.push(event);
    });
      
    api.post("/append-to-stream", inflight (req) => {
      log("append-to-stream: {req.body}");
      
      return handlers.appendToStream(req, 
        transactionsTableName: transactionsTable.name,
        dynamodb: transactionsTable.client(),
      );
    });

    api.post("/read-stream", inflight (req) => {
      log("read-stream: {req.body}");

      return handlers.readStream(req,
        dynamodb: streams.table.client(),
        streamsTableName: streams.table.name,
      );
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
