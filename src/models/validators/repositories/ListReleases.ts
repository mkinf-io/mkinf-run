import { type } from 'superstruct';
import { asOptionalArray } from '../validators/asArray';
import repositoryId from '../validators/isRepositoryId';

const ListReleases = type({
	ids: asOptionalArray(repositoryId())
});

export default ListReleases;
