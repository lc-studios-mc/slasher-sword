import { parseArgs } from "node:util";
import { build } from "../build";
import { getProjectConfig } from "../project";

const cliArgs = parseArgs({
	options: {
		dev: {
			type: "boolean",
			default: false,
		},
		version: {
			type: "string",
			default: "0.0.1",
		},
	},
});

const projectConfig = getProjectConfig(cliArgs.values.dev, cliArgs.values.version);

const startTime = performance.now();

await build({ projectConfig });

const endTime = performance.now();
const totalTimeText = (endTime - startTime).toFixed(2);

console.log(`Build finished in ${totalTimeText} ms!`);
