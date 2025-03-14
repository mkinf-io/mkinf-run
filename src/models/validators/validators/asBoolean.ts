import { boolean, coerce, optional, unknown } from 'superstruct';

const asBoolean = () => coerce(boolean(), unknown(), (value) => !!value);

const asOptionalBoolean = () => coerce(optional(boolean()), unknown(), (value) =>
	typeof (value) == "string" ?
		value.toLowerCase() == "true" ? true :
			value.toLowerCase() == "false" ? false
				: undefined
		: undefined
);

export { asBoolean, asOptionalBoolean };
