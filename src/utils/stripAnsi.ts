export default function stripAnsi(str: string) {
	return str.replace(
		// Regex to match ANSI escape codes
		/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g,
		''
	);
}
