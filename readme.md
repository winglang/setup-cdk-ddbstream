#

## Installation

```sh
pnpm install
```

## Dev

```sh
pnpm run dev
```

## Deploy

```sh
pnpm run deploy
```

This application consists of:

- Event Store Stack:
  - Transactions Table
  - Streams Topic
  - Fan Out Handler (consumes transactions streams and publishes events to the streams topic)
  - Streams Table (projection of the events from the streams topic)
  - API:
    - `POST /append-to-stream`
    - `POST /read-stream`
    - See an example in `test/api.test.ts`
- Calendar Service Stack:
  - Table (projection of the events of type `vehicleAssigned` from the event store's streams topic)

## Try the example

- First, deploy the application and retrieve the `EventStoreStack.ApiEndpoint` output.
- Update the `API_ENDPOINT` constant in `test/api.test.ts`
- Run `pnpm tsx test/api.test.ts`
