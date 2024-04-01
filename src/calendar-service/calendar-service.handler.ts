/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { SQSEvent, SQSHandler } from "aws-lambda";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import type extern from "./calendar-service.handler.extern";

const { TABLE_NAME } = process.env;

export const handler: SQSHandler = async (sqsEvent) => {
	await main(sqsEvent, { dynamodb: new DynamoDB(), tableName: TABLE_NAME! });
};

export const calendarService: extern["calendarService"] = async (event, table) => {
	await main(JSON.parse(event), { 
		dynamodb: new DynamoDB(table.clientConfig!),
		tableName: table.tableName,
	});
};

const main = async (sqsEvent: SQSEvent, ctx: { dynamodb: DynamoDB, tableName: string }) => {
	console.log("Processing calendar event", JSON.stringify(sqsEvent, undefined, "\t"));
	await ctx.dynamodb.batchWriteItem({
		RequestItems: {
			[ctx.tableName]: sqsEvent.Records.map((record) => {
				const event = JSON.parse(record.body);
				return {
					PutRequest: {
						Item: {
							vehicleId: { S: event.vehicleId },
							vehicleName: { S: event.vehicleName },
							assignedTo: { S: event.assignedTo },
						},
					},
				};
			}),
		},
	});
};
