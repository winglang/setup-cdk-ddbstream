import { nanoid36 } from "../src/nanoid.js";

// const userId = `user_${nanoid36()}`;
const userId = "user_d9CRQBphGgLHhpNdJf7rWnD9H";

// {
// 	const response = await fetch(
// 		"https://y6zbfrf6s5.execute-api.eu-west-3.amazonaws.com/append-to-stream",
// 		{
// 			method: "POST",
// 			body: JSON.stringify({
// 				streamId: userId,
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

// 	console.log(await response.json());
// }

{
	const response = await fetch(
		"https://y6zbfrf6s5.execute-api.eu-west-3.amazonaws.com/read-stream",
		{
			method: "POST",
			body: JSON.stringify({
				streamId: userId,
			}),
		},
	);

	console.log(
		response.status,
		JSON.stringify(await response.json(), undefined, "\t"),
	);
}
