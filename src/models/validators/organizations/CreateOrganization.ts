import { enums, object, optional, pattern, string, union } from 'superstruct';
import { isBase64Image } from '../validators/isBase64';

const CreteOrganization = object({
	name: pattern(string(), /^[A-Za-z0-9-_]+$/),
	image: optional(
		union([
			string(),
			object({
				type: enums(["image/png", "image/jpeg", "image/gif"]),
				file: isBase64Image(),
			})
		])
	)
});

export default CreteOrganization;
