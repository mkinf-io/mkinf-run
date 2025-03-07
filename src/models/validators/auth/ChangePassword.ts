import { object, string } from 'superstruct'

const ChangePassword = object({
	current_password: string(),
	new_password: string(),
});

export default ChangePassword;