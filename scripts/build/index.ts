import type { ProjectConfig } from "../project";

type BuildContext = {
	projectConfig: ProjectConfig;
};

export const build = async (ctx: BuildContext): Promise<void> => {
	console.log("Building...");

	// TODO: Implement build
};
