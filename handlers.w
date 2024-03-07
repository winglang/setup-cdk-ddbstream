bring cloud;
bring ex;
bring "./dynamo-table.w" as dynamodb;

pub class Util {
  pub extern "./src/event-store/api.append-to-stream-handler.ts" static inflight appendToStream(event: cloud.ApiRequest, ctx: AppendToStreamContext): cloud.ApiResponse;
  pub extern "./src/event-store/api.read-stream-handler.ts" static inflight readStream(event: cloud.ApiRequest, ctx: ReadStreamContext): cloud.ApiResponse;
  pub extern "./src/event-store/stream-sequencer.handler.ts" static inflight streamSequencer(event: Json, ctx: StreamSequencerContext): void;
  // pub extern "./src/event-store/event-store.fan-out-handler.ts" static inflight fanout(event: Json, ctx: FanOutContext): void;
}

struct AppendToStreamContext {
  dynamodb: dynamodb.IAwsClient;
  transactionsTableName: str;
}

struct ReadStreamContext {
  dynamodb: dynamodb.IAwsClient;
  streamsTableName: str;
}

struct StreamSequencerContext {
  dynamodb: dynamodb.IAwsClient;
  streamsTableName: str;
}

// struct FanOutContext {
//   sns: sns.IAwsClient;
//   streamsTopicArn: str;
// }