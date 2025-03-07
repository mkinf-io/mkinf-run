import { define, intersection, string } from 'superstruct'
import isUUID from "is-uuid"

const uuidOnly = () => define('uuid', (value) => isUUID.anyNonNil(value as string));
const uuid = () => intersection([string(), uuidOnly()]);

export { uuid, uuidOnly };