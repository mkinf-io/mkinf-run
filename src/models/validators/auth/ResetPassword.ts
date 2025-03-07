import { object } from 'superstruct'
import { email } from '../validators/isEmail';

const ResetPassword = object({
	email: email(),
});

export default ResetPassword;