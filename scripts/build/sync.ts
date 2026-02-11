import { execa } from "execa";
import fs from "fs-extra";
import os from "node:os";

const isWsl = () => {
	if (process.platform !== "linux") return false;
	const release = os.release().toLowerCase();
	return release.includes("microsoft") || release.includes("wsl");
};

const toWinPath = async (p: string): Promise<string> => {
	const { stdout } = await execa("wslpath", ["-w", p]);
	return stdout.trim();
};

const isWinPath = async (p: string): Promise<boolean> => {
	if (/^\/mnt\/[a-z]\//i.test(p)) return true;
	try {
		return /^[a-zA-Z]:/.test(await toWinPath(p));
	} catch {
		return false;
	}
};

const ROBOCOPY_FLAGS = ["/MIR", "/COPY:DT", "/DCOPY:DAT", "/R:0", "/W:0", "/MT:32", "/XJ"] as const;

const robocopy = async (src: string, dest: string): Promise<void> => {
	const { exitCode, stderr } = await execa("robocopy.exe", [src, dest, ...ROBOCOPY_FLAGS], {
		reject: false,
		windowsHide: true,
	});
	if (Number(exitCode) >= 8) throw new Error(`Robocopy failed (${exitCode}): ${stderr}`);
};

const rsync = async (src: string, dest: string): Promise<void> => {
	// Ensure src ends with / to match robocopy's folder-content sync behavior
	const srcPath = src.endsWith("/") ? src : `${src}/`;
	await fs.ensureDir(dest);
	await execa("rsync", ["-az", "--delete", srcPath, dest]);
};

export const syncDirectory = async (src: string, dest: string): Promise<void> => {
	if (process.platform === "win32") {
		return robocopy(src, dest);
	}

	if (isWsl() && (await isWinPath(dest))) {
		return robocopy(await toWinPath(src), await toWinPath(dest));
	}

	if (process.platform === "linux" || process.platform === "darwin") {
		return rsync(src, dest);
	}

	throw new Error(`Unsupported platform: ${process.platform}`);
};
