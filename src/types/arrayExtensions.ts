interface Array<T> {
	mapNotNull<U>(callbackfn: (value: T, index: number, array: T[]) => U | null | undefined, thisArg?: any): U[];
}

if (!Array.prototype.mapNotNull) {
	Array.prototype.mapNotNull = function <T, U>(callbackfn: (value: T, index: number, array: T[]) => U | null | undefined, thisArg?: any): U[] {
		const result: U[] = [];
		const arr = this as T[];
		for (let i = 0; i < arr.length; i++) {
			if (i in arr) {
				const mappedValue = callbackfn.call(thisArg, arr[i], i, arr);
				if (mappedValue) {
					result.push(mappedValue);
				}
			}
		}
		return result;
	};
}
