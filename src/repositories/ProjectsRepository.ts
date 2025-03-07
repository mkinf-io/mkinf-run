import { DatabaseClient } from '../types/databaseExtensions.types';

export default class ProjectsRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	get = async (_: { id: string }) => {
		return await this.db
			.from("projects")
			.select(`
				id,
				name,
				version,
				organization: organizations(
					id,
					name,
					stripe_customer_id
				)
			`)
			.eq("id", _.id)
			.maybeSingle();
	}

	getProviderId = async (_: { id: string }): Promise<string | undefined> => {
		const res = await this.db
			.from("projects")
			.select("provider_id")
			.eq("id", _.id)
			.single();
		return res.data?.provider_id;
	}

	canAccess = async (_: { project_id: string, user_id?: string, key_id?: string }) => {
		if (_.key_id) {
			const res = await this.db
				.from("keys")
				.select("project_id")
				.eq("id", _.key_id)
				.eq("project_id", _.project_id)
				.single();
			return !!res.data;
		} else if (_.user_id) {
			const res = await this.db
				.from("users_organizations")
				.select(`
					organizations(
						projects(
							id
						)
					)
				`)
				.eq("user_id", _.user_id)
				.eq("organizations.projects.id", _.project_id)
				.single();
			return (res.data?.organizations?.projects.length ?? 0) > 0;
		}
		return false;
	}
}
