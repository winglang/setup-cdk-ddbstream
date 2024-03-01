import { writeFile } from "node:fs/promises";
import { nanoid36 } from "./nanoid.js";

const numIds = 100_000;
const ids = new Array<string>();
for (let i = 0; i < numIds; i++) {
	ids.push(`user_${nanoid36()}`);
}
await writeFile("ids.json", JSON.stringify(ids, null, "\t"));
