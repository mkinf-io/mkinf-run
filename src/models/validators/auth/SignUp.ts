import { object, string } from 'superstruct'

const SignUp = object({
	email: string(),
	password: string(),
});

export default SignUp;