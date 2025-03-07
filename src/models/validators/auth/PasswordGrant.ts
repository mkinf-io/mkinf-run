import { string, type } from 'superstruct'
import { email } from '../validators/isEmail';

const PasswordGrant = type({
	email: email(),
	password: string()
});

export default PasswordGrant;