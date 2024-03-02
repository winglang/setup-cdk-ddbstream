import { nanoid36 } from "../src/nanoid.js";

// const userId = `user_${nanoid36()}`;
const userId = "user_d9CRQBphGgLHhpNdJf7rWnD9H";

// {
// 	const response = await fetch(
// 		"https://h0mutar776.execute-api.eu-west-3.amazonaws.com/append-to-stream",
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
// 		"https://h0mutar776.execute-api.eu-west-3.amazonaws.com/read-stream",
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
	const response = await fetch(
		"https://h0mutar776.execute-api.eu-west-3.amazonaws.com/append-to-stream",
		{
			method: "POST",
			body: JSON.stringify({
				streamId: `vehicle_${nanoid36()}`,
				// expectedRevision: "any",
				events: [
					{
						type: "vehicleAssigned",
						data: {
							vehicleId: "vehicle_2",
							vehicleName: "toyota",
							assignedTo: "user_2",
						},
					},
				],
			}),
		},
	);

	console.log(response.status, await response.json());
}
