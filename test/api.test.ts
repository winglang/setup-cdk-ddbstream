import { nanoid36 } from "../src/nanoid.js";

const userId = `user_${nanoid36()}`;

const response = await fetch(
	"https://y6zbfrf6s5.execute-api.eu-west-3.amazonaws.com/append-to-stream",
	{
		method: "POST",
		body: JSON.stringify({
			streamId: userId,
			events: [
				{
					type: "UserCreated",
					data: {
						userId,
					},
				},
			],
		}),
	},
);

console.log(await response.json());
