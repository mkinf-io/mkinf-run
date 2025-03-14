import { type } from 'superstruct';
import { asOptionalArray } from '../validators/asArray';
import { asOptionalBoolean } from '../validators/asBoolean';
import repositoryId from '../validators/isRepositoryId';

const ListRepositories = type({
	ids: asOptionalArray(repositoryId()),
	is_private: asOptionalBoolean(),
	is_hosted: asOptionalBoolean()
});

export default ListRepositories;
