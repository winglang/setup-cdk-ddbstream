bring cloud;
bring ex;
bring dynamodb;

pub class Util {
  pub extern "../src/event-store/api.append-to-stream-handler.ts" static inflight appendToStream(event: cloud.ApiRequest, transactionsTable: dynamodb.Connection): cloud.ApiResponse;
  pub extern "../src/event-store/api.read-stream-handler.ts" static inflight readStream(event: cloud.ApiRequest, streamsTable: dynamodb.Connection): cloud.ApiResponse;
  pub extern "../src/event-store/stream-sequencer.handler.ts" static inflight streamSequencer(event: Json, streamsTable: dynamodb.Connection): void;
}
