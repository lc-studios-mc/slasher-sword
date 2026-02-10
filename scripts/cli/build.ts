import { parseArgs } from "node:util";
import { build } from "../build";

const { values } = parseArgs({
	options: {
		dev: {
			type: "boolean",
			default: false,
		},
	},
});

await build({
	dev: values.dev,
});
