import { string, type } from 'superstruct'

const RefreshTokenGrant = type({
	refresh_token: string()
});

export default RefreshTokenGrant;