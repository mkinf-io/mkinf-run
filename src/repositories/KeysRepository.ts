import { RepositoryId } from '../models/dto/RepositoryId';
import { DatabaseClient } from '../types/databaseExtensions.types';

export default class KeysRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	get = async (_: { id?: string, value?: string }) => {
		const query = this.db
			.from("keys")
			.select(`
				id,
				created_at,
				project: projects(
					id,
					organization: organizations(
						id,
						stripe_customer_id
					)
				)
			`);
		if (_.id) { query.eq("id", _.id); }
		if (_.value) { query.eq("value", _.value); }
		return await query.single();
	}

	listOrganizations = async (_: { key_id: string }) => {
		return await this.db
			.from("keys")
			.select(`
				...projects(
						organization: organizations(
							id,
							name,
							image,
							stripe_customer_id
						)
				)
			`)
			.eq("id", _.key_id); // This "id" filter refers to the keys table
	}

	listProjects = async (_: { key_id: string }) => {
		return await this.db
			.from("keys")
			.select(`
				...projects(
						id,
						organization_id,
						name,
						version
					)
			`)
			.eq("id", _.key_id); // This "id" filter refers to the keys table
	}
}
