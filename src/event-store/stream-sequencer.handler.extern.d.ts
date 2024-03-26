export default interface extern {
  streamSequencer: (event: Readonly<any>, ctx: StreamSequencerContext) => Promise<void>,
}
export interface Connection {
  readonly endpoint?: (string) | undefined;
  readonly tableName: string;
}
export interface StreamSequencerContext {
  readonly streamsTableConnection: Connection;
}