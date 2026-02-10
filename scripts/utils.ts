export const getEnv = (key: string): string | undefined => process.env[key];

export const getEnvWithFallback = (key: string, fallback: string): string =>
	process.env[key] ?? fallback;

export const getEnvRequired = (key: string, customErrorMsg?: string): string => {
	const value = process.env[key];
	if (typeof value !== "string")
		throw new Error(customErrorMsg ?? `The environment variable '${key}' is required but not set.`);
	return value;
};

export const parseVersionString = (versionString: string): number[] => {
	const parts = versionString.split(".");
	if (parts.length !== 3) {
		throw new Error(
			'The string must contain exactly three integer parts separated by dots (e.g., "1.2.3").',
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
