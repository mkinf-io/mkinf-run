import { array, coerce, optional, Struct } from 'superstruct';

const asArray = <T, S>(struct: Struct<T, S>) =>
	coerce(array(struct), struct, (value) => Array.isArray(value) ? value : [value])

const asOptionalArray = <T, S>(struct: Struct<T, S>) =>
	coerce(optional(array(struct)), struct, (value) =>
		value == null || value == undefined ? undefined : Array.isArray(value) ? value : [value])

export { asArray, asOptionalArray };
