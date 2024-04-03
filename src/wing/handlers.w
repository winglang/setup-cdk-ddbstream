bring cloud;
bring ex;
bring dynamodb;

pub class Util {
  pub extern "../event-store/api.append-to-stream-handler.ts" static inflight appendToStream(event: cloud.ApiRequest, transactionsTable: dynamodb.Connection): cloud.ApiResponse;
  pub extern "../event-store/api.read-stream-handler.ts" static inflight readStream(event: cloud.ApiRequest, streamsTable: dynamodb.Connection): cloud.ApiResponse;
  pub extern "../event-store/stream-sequencer.handler.ts" static inflight streamSequencer(event: str, streamsTable: dynamodb.Connection): void;
  pub extern "../event-store/event-store.fan-out-handler.ts" static inflight eventStoreFanOut(event: Json, topic: cloud.Topic): void;
}
