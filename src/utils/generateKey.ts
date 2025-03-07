import crypto from 'crypto';

export function generateOrgSecretKey() {
	return `sk-org-${crypto.randomBytes(32).toString('hex')}`;
}
