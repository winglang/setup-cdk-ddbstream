const response = await fetch(
	"https://y6zbfrf6s5.execute-api.eu-west-3.amazonaws.com/append-to-stream",
	{
		method: "POST",
		body: JSON.stringify({
			streamId: "user_11",
			events: [
				{
					type: "UserCreated",
					data: {
						userId: "user_11",
					},
				},
			],
		}),
	},
);

console.log(await response.json());
