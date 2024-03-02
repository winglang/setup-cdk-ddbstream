import { nanoid36 } from "../src/nanoid.js";

const API_ENDPOINT = "https://h0mutar776.execute-api.eu-west-3.amazonaws.com";

// const userId = `user_${nanoid36()}`;
const userId = "user_d9CRQBphGgLHhpNdJf7rWnD9H";

// {
// 	const response = await fetch(
// 		`${API_ENDPOINT}/append-to-stream`,
// 		{
// 			method: "POST",
// 			body: JSON.stringify({
// 				streamId: userId,
// 				// expectedRevision: "any",
// 				events: [
// 					{
// 						type: "UserCreated",
// 						data: {
// 							userId,
// 						},
// 					},
// 				],
// 			}),
// 		},
// 	);

// 	console.log(response.status, await response.json());
// }

// {
// 	const response = await fetch(
// 		`${API_ENDPOINT}/read-stream`,
// 		{
// 			method: "POST",
// 			body: JSON.stringify({
// 				streamId: userId,
// 			}),
// 		},
// 	);

// 	console.log(
// 		response.status,
// 		JSON.stringify(await response.json(), undefined, "\t"),
// 	);
// }

{
	const response = await fetch(`${API_ENDPOINT}/append-to-stream`, {
		method: "POST",
		body: JSON.stringify({
			streamId: `vehicle_${nanoid36()}`,
			// expectedRevision: "any",
			events: [
				{
					type: "vehicleAssigned",
					data: {
						vehicleId: "vehicle_3",
						vehicleName: "toyota",
						assignedTo: "user_3",
					},
				},
			],
		}),
	});

	console.log(response.status, await response.json());
}
