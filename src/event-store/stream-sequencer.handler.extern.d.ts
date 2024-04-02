export default interface extern {
  streamSequencer: (event: string, streamsTable: Connection) => Promise<void>,
}
export interface Credentials {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}
export interface ClientConfig {
  readonly credentials: Credentials;
  readonly endpoint: string;
  readonly region: string;
}
export interface Connection {
  readonly clientConfig?: (ClientConfig) | undefined;
  readonly tableName: string;
}