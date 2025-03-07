import RepositoryAccessRole from '../models/enums/hub/RepositoryAccessRole';
import UserProfileAccessRole from '../models/enums/hub/UserProfileAccessRole';
import { DatabaseClient } from '../types/databaseExtensions.types';

export default class RepositoriesRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	async get(_: { organization_name: string, name: string }) {
		return await this.db
			.from("repositories")
			.select(`
				owner: organization_name,
				name,
				description,
				is_private,
				is_hosted: hosted_releases(count),
				runs: runs(count),
				...organizations(image),
				created_at
			`)
			.eq("organization_name", _.organization_name)
			.eq("name", _.name)
			.maybeSingle();
	}

	listOwnerRepositories = async (_: { owner: string, asGuest?: boolean }) => {
		const query = this.db
			.from("repositories")
			.select(`
				owner: organization_name,
				name,
				description,
				is_private,
				is_hosted: hosted_releases(count),
				runs: runs(count),
				...organizations(image),
				created_at
			`)
			.eq("organization_name", _.owner)
			.order("created_at", { ascending: false });
		if (_.asGuest == true) query.eq("is_private", false)
		return await query;
	}

	async getUserProfileAccessRole(_: {
		user_handle: string,
		user_id?: string,
		key_id?: string
	}): Promise<UserProfileAccessRole | null> {
		if (_.user_id) {
			const res = await this.db
				.from("user_profiles")
				.select("user_id")
				.eq("handle", _.user_handle)
				.maybeSingle()
			return !res.error && res.data ? res.data.user_id == _.user_id ? UserProfileAccessRole.owner : UserProfileAccessRole.guest : null
		} else if (_.key_id) {
			return UserProfileAccessRole.guest
		}
		return null;
	}

	async getRepositoryAccessRole(_: {
		organization_name: string,
		repository_name: string,
		user_id?: string,
		key_id?: string
	}): Promise<RepositoryAccessRole | null> {
		if (_.user_id) {
			const res = await this.db
				.from("repositories_members")
				.select("organization_name, name, is_private, member")
				.eq("organization_name", _.organization_name)
				.eq("name", _.repository_name)
				.or(`member.eq.${_.user_id},is_private.eq.false`)
			const canAccess = !res.error && res.data.length > 0;
			return canAccess ? res.data?.find((e) => e.member == _.user_id) ? RepositoryAccessRole.owner : RepositoryAccessRole.guest : null;
		} else if (_.key_id) {
			const res = await this.db
				.from("repositories_keys")
				.select(`organization_name, name, is_private, key_id`)
				.eq("organization_name", _.organization_name)
				.eq("name", _.repository_name)
				.or(`key_id.eq.${_.key_id},is_private.eq.false`)
			const canAccess = !res.error && res.data.length > 0;
			return canAccess ? res.data?.find((e) => e.key_id == _.key_id) ? RepositoryAccessRole.owner : RepositoryAccessRole.guest : null;
		}
		return null;
	}
}
