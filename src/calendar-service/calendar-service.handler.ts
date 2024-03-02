/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { SQSHandler } from "aws-lambda";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const { TABLE_NAME } = process.env;
const dynamodb = new DynamoDB();

export const handler: SQSHandler = async (sqsEvent) => {
	console.log(
		"Processing sqs event",
		JSON.stringify(
			{
				RequestItems: {
					[TABLE_NAME!]: sqsEvent.Records.map((record) => {
						const event = JSON.parse(record.body);
						console.log({
							PutRequest: {
								Item: {
									vehicleId: { S: event.vehicleId },
									vehicleName: { S: event.vehicleName },
									assignedTo: { S: event.assignedTo },
								},
							},
						});
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
			},
			undefined,
			"\t",
		),
	);
	// await dynamodb.batchWriteItem({
	// 	RequestItems: {
	// 		[TABLE_NAME!]: sqsEvent.Records.map((record) => {
	// 			const event = JSON.parse(record.body);
	// 			console.log({
	// 				PutRequest: {
	// 					Item: {
	// 						vehicleId: { S: event.vehicleId },
	// 						vehicleName: { S: event.vehicleName },
	// 						assignedTo: { S: event.assignedTo },
	// 					},
	// 				},
	// 			});
	// 			return {
	// 				PutRequest: {
	// 					Item: {
	// 						vehicleId: { S: event.vehicleId },
	// 						vehicleName: { S: event.vehicleName },
	// 						assignedTo: { S: event.assignedTo },
	// 					},
	// 				},
	// 			};
	// 		}),
	// 	},
	// });
};
