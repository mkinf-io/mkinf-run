import { coerce, number, optional, unknown } from 'superstruct';
import tryCatch from '../../../utils/tryCatch';

const asInt = () => coerce(number(), unknown(), (value) => value != undefined ? tryCatch(() => parseInt(`${value}`), undefined) : undefined);
const asOptionalInt = () => coerce(optional(number()), unknown(), (value) => value != undefined ? tryCatch(() => parseInt(`${value}`), undefined) : undefined);

export { asInt, asOptionalInt };
