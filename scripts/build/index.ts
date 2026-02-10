type BuildOptions = {
	dev: boolean;
};

const executeBuild = async (options: BuildOptions): Promise<void> => {
	console.log("Building...");
};

export const build = async (options: BuildOptions): Promise<void> => {
	const startTime = performance.now();

	await executeBuild(options);

	const endTime = performance.now();
	const totalTimeText = (endTime - startTime).toFixed(2);

	console.log(`Build finished in ${totalTimeText} ms!`);
};
