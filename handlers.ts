import { DynamoDB } from "@aws-sdk/client-dynamodb";

export async function dynamoClient(table: any) {
  return new DynamoDB({
    region: "local",
    credentials: { accessKeyId: "x", secretAccessKey: "y" },
    endpoint: await table.endpoint(),
  });
}
