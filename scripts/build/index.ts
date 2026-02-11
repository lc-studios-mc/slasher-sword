import esbuild from "esbuild";
import fg from "fast-glob";
import fs from "fs-extra";
import json5 from "json5";
import path from "node:path";
import type { ProjectConfig } from "../project";
import { syncDirectory } from "./sync";

type BuildContext = {
	projectConfig: ProjectConfig;
};

const ensureEmptyOutDir = async (outDir: string): Promise<void> => {
	await fs.rm(outDir, { recursive: true, force: true });
	await fs.ensureDir(outDir);
};

const performBasicPack = async (srcDir: string, outDir: string): Promise<void> => {
	const entries = await fg.async("**/*", {
		cwd: srcDir,
		ignore: ["scripts/**", "tsconfig.json"],
		absolute: false,
		dot: true,
		onlyFiles: true,
	});

	const promises = entries.map(async (entry) => {
		const parsedPath = path.parse(entry);
		const absSrcPath = path.join(srcDir, entry);

		if (parsedPath.ext === ".json5") {
			parsedPath.ext = ".json";
			parsedPath.base = "";
			const destPath = path.join(outDir, path.format(parsedPath));

			const originalText = await fs.readFile(absSrcPath, "utf8");
			const data = json5.parse(originalText);
			const finalText = JSON.stringify(data, null, 2);
			await fs.outputFile(destPath, finalText, "utf8");
			return;
		}

		const destPath = path.join(outDir, entry);
		await fs.ensureDir(path.dirname(destPath));
		await fs.copy(absSrcPath, destPath);
	});

	await Promise.all(promises);
};

const bundleScripts = async (packSrcDir: string, packOutDir: string): Promise<void> => {
	const sourceRoot = path.join(packSrcDir, "scripts");
	const entryPoint = path.join(sourceRoot, "entry.ts");
	const scriptsOutDir = path.join(packOutDir, "scripts");

	await esbuild.build({
		entryPoints: [entryPoint],
		outdir: scriptsOutDir,
		bundle: true,
		external: ["@minecraft"],
		platform: "node",
		format: "esm",
	});
};

const createManifest = async (outDir: string, manifest: unknown): Promise<void> => {
	const text = JSON.stringify(manifest, null, 2);
	const destPath = path.join(outDir, "manifest.json");
	await fs.outputFile(destPath, text, "utf8");
};

const syncOutput = async (dir: string, syncTargets: string[]): Promise<void> => {
	const promises = syncTargets.map((target) => syncDirectory(dir, target));
	await Promise.all(promises);
};

export const build = async (ctx: BuildContext): Promise<void> => {
	await Promise.all([
		ensureEmptyOutDir(ctx.projectConfig.bpOutDir),
		ensureEmptyOutDir(ctx.projectConfig.rpOutDir),
	]);

	console.log("Performing basic packing...");

	await Promise.all([
		performBasicPack(ctx.projectConfig.bpSrcDir, ctx.projectConfig.bpOutDir),
		performBasicPack(ctx.projectConfig.rpSrcDir, ctx.projectConfig.rpOutDir),
	]);

	console.log("Bundling behavior pack scripts...");

	await bundleScripts(ctx.projectConfig.bpSrcDir, ctx.projectConfig.bpOutDir);

	console.log("Creating pack manifests...");

	await Promise.all([
		createManifest(ctx.projectConfig.bpOutDir, ctx.projectConfig.bpManifest),
		createManifest(ctx.projectConfig.rpOutDir, ctx.projectConfig.rpManifest),
	]);

	if (ctx.projectConfig.bpSyncTargets.length + ctx.projectConfig.rpSyncTargets.length > 0) {
		console.log("Syncing output to targets...");

		await Promise.all([
			syncOutput(ctx.projectConfig.bpOutDir, ctx.projectConfig.bpSyncTargets),
			syncOutput(ctx.projectConfig.rpOutDir, ctx.projectConfig.rpSyncTargets),
		]);
	}
};
