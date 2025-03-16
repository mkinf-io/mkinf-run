type RepositoryId = {
	owner: string;
	name: string;
}

const mapRepositoryId = (id: string): RepositoryId => (([owner, name]) => ({ owner, name }))(id.split("/"))

export { mapRepositoryId, RepositoryId };
