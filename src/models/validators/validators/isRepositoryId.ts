import { refine, string } from 'superstruct';

const repositoryId = () => refine(
	string(),
	'repositoryId',
	(value) => typeof (value) == "string" ? value.split("/").length == 2 : false
);

export default repositoryId;
