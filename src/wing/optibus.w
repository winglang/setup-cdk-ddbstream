bring cloud;
bring dynamodb;
bring "./handlers.w" as handlers;



pub class ClientService {
	pub queue: cloud.Queue;
	new() {
		this.queue = new cloud.Queue();
	}
}

class StreamSequencer {
  pub table: dynamodb.Table;
  pub queue: cloud.Queue;

  new(streamIdAttribute: str, revisionAttribute: str) {
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
pub struct EventStoreProps {
	streamIdAttribute: str;
	revisionAttribute: str;
	appendStreamRoute: str;
}
pub class EventStore {
  pub url: str;
  topic: cloud.Topic;

	static inflight  onTopicToSqs(event: str):Json{
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
	}

  new(props: EventStoreProps) {
    let api = new cloud.Api();
    this.url = api.url;

    let transactionsTable = new dynamodb.Table(
      name: "transactions_table",
      hashKey: props.streamIdAttribute,
      attributes: [ { name: props.streamIdAttribute, type: "S" } ],
    );

    let streams = new StreamSequencer(props.streamIdAttribute, props.revisionAttribute);

    this.topic = new cloud.Topic();
    this.topic.onMessage(inflight (event) => {
      let record = EventStore.onTopicToSqs(event);
      streams.queue.push(Json.stringify({ Records: [record] }));
    });

    transactionsTable.setStreamConsumer(inflight (record) => {
      handlers.eventStoreFanOut({ Records: [record] }, this.topic);
    });

    api.post(props.appendStreamRoute, inflight (req) => {
      log("append-to-stream: {req.body!}");
      return handlers.appendToStream(req, transactionsTable.connection);
    });

  }

	pub subscribeQueue(queue: cloud.Queue ) {
		this.topic.onMessage(inflight (event) => {
			let record = EventStore.onTopicToSqs(event);
			queue.push(Json.stringify({ Records: [record] }));
		});
	}
}
