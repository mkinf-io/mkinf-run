import { define, intersection, string } from 'superstruct'
import EmailValidator from 'email-validator';

const emailOnly = () => define('email', (value) => EmailValidator.validate(value as string));
const email = () => intersection([string(), emailOnly()]);

export { email, emailOnly };