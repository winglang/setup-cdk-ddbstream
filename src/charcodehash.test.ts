import { charcodehash } from "./charcodehash.js";
import values from "./ids.json" assert { type: "json" };
// import values from "./emails.json" assert { type: "json" };

const numShards = 10;
const groups = new Map<number, number>();
const start = Date.now();
for (const value of values) {
	const hash = charcodehash(value);
	const shardId = hash % numShards;
	groups.set(shardId, (groups.get(shardId) ?? 0) + 1);
}
console.log(`Time: ${Date.now() - start}ms`);
for (let i = 0; i < numShards; i++) {
	console.log(
		`Shard ${i}: ${(((groups.get(i) ?? 0) * 100) / values.length).toPrecision(
			3,
		)}%`,
	);
}
