import { object, optional, string } from 'superstruct';

const ListBillingUrls = object({
	return_url: optional(string())
});

export default ListBillingUrls;
