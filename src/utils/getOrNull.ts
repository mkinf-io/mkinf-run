function getOrNull<T>(array: T[], index: number): T | null {
	return (index >= 0 && index < array.length) ? array[index] : null;
}

function getOrDefault<T>(array: T[], index: number, def: T): T {
	return (index >= 0 && index < array.length) ? array[index] : def;
}

function firstOrNull<T>(array: T[]): T | null {
	return (0 < array.length) ? array[0] : null;
}

export { getOrNull, getOrDefault, firstOrNull };