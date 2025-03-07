import { enums, type } from 'superstruct'

const RequestToken = type({
	grant_type: enums(["password", "refresh_token"])
});

export default RequestToken;