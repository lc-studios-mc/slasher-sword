import path from "node:path";

const getEnvRequired = (key: string, customErrorMsg?: string): string => {
	const value = process.env[key];
	if (typeof value !== "string")
		throw new Error(customErrorMsg ?? `The environment variable '${key}' is required but not set.`);
	return value;
};

const parseVersionString = (versionString: string): number[] => {
	const parts = versionString.split(".");
	if (parts.length !== 3) {
		throw new Error(
			'Version string must contain exactly three integer parts separated by dots (e.g., "1.2.3").',
		);
	}

	const numbers = parts.map((part) => {
		const num = Number(part);
		if (part.trim() === "" || !Number.isInteger(num)) {
			throw new Error(`The segment "${part}" is not a valid integer.`);
		}
		return num;
	});
	return numbers;
};

export type ProjectConfig = ReturnType<typeof getProjectConfig>;

export const getProjectConfig = (dev: boolean, versionString: string) => {
	const slug = "slasher-sword";
	const projectName = "Slasher Sword";
	const description = "Fun chainsaw/sword addon by LC Studios MC";
	const minEngineVersion = [1, 21, 130];
	const versionArray = parseVersionString(versionString); // [0, 0, 1]
	const versionLabel = `v${versionArray.join(".")}`; // "v0.0.1"
	const displayName = `${projectName} ${dev ? "DEV" : versionLabel}`;

	// https://www.uuidgenerator.net/version4
	const uuid = {
		bpHeader: "f8775497-a00d-41a5-b69a-535ae8c18a29",
		bpDataModule: "77c6bf24-f2b6-4816-b872-36a4b13cfae1",
		bpScriptsModule: "756394ff-1a42-4517-a589-29f54940403e",
		rpHeader: "accf87b4-c40a-4bf7-bce0-fe054b563327",
		rpResourcesModule: "11cdb8d4-e27c-463f-b3ed-e56a0ccb2b8c",
	} as const;

	const bpManifest: Record<string, unknown> = {
		format_version: 2,
		header: {
			name: displayName,
			description,
			uuid: uuid.bpHeader,
			version: versionArray,
			min_engine_version: minEngineVersion,
		},
		modules: [
			{
				type: "data",
				uuid: uuid.bpDataModule,
				version: versionArray,
			},
			{
				language: "javascript",
				type: "script",
				uuid: uuid.bpScriptsModule,
				version: versionArray,
				entry: "scripts/entry.js",
			},
		],
		dependencies: [
			{
				uuid: uuid.rpHeader,
				version: versionArray,
			},
		],
	};

	const rpManifest: Record<string, unknown> = {
		format_version: 2,
		header: {
			name: displayName,
			description,
			uuid: uuid.rpHeader,
			version: versionArray,
			min_engine_version: minEngineVersion,
		},
		modules: [
			{
				type: "resources",
				uuid: uuid.rpResourcesModule,
				version: versionArray,
			},
		],
		capabilities: ["pbr"],
	};

	const bpSrcDir = path.resolve("src/bp");
	const rpSrcDir = path.resolve("src/rp");
	const outPrefix = path.resolve(dev ? `dist/dev` : `dist/${versionLabel}`);
	const bpOutDir = path.join(outPrefix, "bp");
	const rpOutDir = path.join(outPrefix, "rp");

	const bpSyncTargets: string[] = [];
	const rpSyncTargets: string[] = [];
	if (dev) {
		const devBpPrefix = path.resolve(getEnvRequired("DEV_BP_PREFIX"));
		const devRpPrefix = path.resolve(getEnvRequired("DEV_RP_PREFIX"));
		bpSyncTargets.push(path.join(devBpPrefix, slug));
		rpSyncTargets.push(path.join(devRpPrefix, slug));
	}

	return {
		bpManifest,
		bpSrcDir,
		bpOutDir,
		bpSyncTargets,
		rpManifest,
		rpSrcDir,
		rpOutDir,
		rpSyncTargets,
	};
};
