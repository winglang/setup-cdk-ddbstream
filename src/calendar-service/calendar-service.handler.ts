/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type extern from "./calendar-service.handler.extern";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

export const calendarService: extern["calendarService"] = async (event, table) => {
	let dynamoDb = new DynamoDB(table.clientConfig!);
	let tableName =  table.tableNam;
	await dynamodb.batchWriteItem({
		RequestItems: {
			[tableName]: event.Records.map((record) => {
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
