import OrganizationAccessRole from '../models/enums/hub/OrganizationAccessRole';
import KeyType from '../models/enums/KeyType';
import { DatabaseClient } from '../types/databaseExtensions.types';

export default class OrganizationsRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	async get(_: { id?: string, name?: string }) {
		const query = this.db
			.from("organizations")
			.select(`
				id,
				image,
				name,
				stripe_customer_id,
				created_at,
				repositories: repositories_members(
					owner: organization_name,
					name,
					description,
					image,
					is_private,
					is_hosted,
					runs,
					created_at
				),
				members: users_organizations(
					id: user_id,
					...users(
					 ...user_profiles(
							handle,
							full_name,
							image
						)
					)
				)
			`);
		if (_.id) {
			query.eq("id", _.id)
		} else if (_.name) {
			query.eq("name", _.name)
		} else {
			throw Error("Error - missing id or name in get organization query")
		}
		return await query.maybeSingle();
	}

	async create(_: { user_id: string, name: string, image?: string, stripe_customer_id?: string }) {
		const org = await this.db
			.from("organizations")
			.insert({
				name: _.name,
				image: _.image,
				stripe_customer_id: _.stripe_customer_id
			})
			.select()
			.single();
		if (org.error || !org.data) {
			return org;
		}
		const nm = await this.db
			.from("users_organizations")
			.insert({
				organization_id: org.data.id,
				user_id: _.user_id,
			});
		if (nm.error) {
			await this.db.from("organizations").delete().eq("id", org.data.id);
			return nm;
		}
		return org;
	}

	async update(_: { id: string, name?: string, image?: string, stripe_customer_id?: string }) {
		let update = {};
		if (_.name) { update = { ...update, name: _.name } }
		if (_.image) { update = { ...update, image: _.image } }
		if (_.stripe_customer_id) { update = { ...update, stripe_customer_id: _.stripe_customer_id } }
		return await this.db
			.from("organizations")
			.update(update)
			.eq("id", _.id)
			.select()
			.single();
	}

	async getOrganizationProfileAccessRole(_: {
		organization_id: string,
		user_id?: string,
		key_id?: string,
		key_type?: KeyType
	}): Promise<OrganizationAccessRole | null>
	async getOrganizationProfileAccessRole(_: {
		organization_name: string,
		user_id?: string,
		key_id?: string,
		key_type?: KeyType
	}): Promise<OrganizationAccessRole | null>;
	async getOrganizationProfileAccessRole(_: {
		organization_name?: string,
		organization_id?: string,
		user_id?: string,
		key_id?: string,
		key_type?: KeyType
	}): Promise<OrganizationAccessRole | null> {
		if (_.user_id) {
			const query = this.db
				.from("organizations_members")
				.select()
				.eq("user_id", _.user_id);
			if (_.organization_id) {
				query.eq("organization_id", _.organization_id)
			} else if (_.organization_name) {
				query.eq("organization_name", _.organization_name)
			}
			return (await query.maybeSingle()).data ? OrganizationAccessRole.owner : OrganizationAccessRole.guest;
		} else if (_.key_id) {
			let query
			if (_.key_type === KeyType.project) {
				query = this.db
					.from("organizations_prj_keys")
					.select()
					.eq("prj_key_id", _.key_id);
				if (_.organization_id) {
					query.eq("organization_id", _.organization_id)
				} else if (_.organization_name) {
					query.eq("organization_name", _.organization_name)
				}
			} else {
				query = this.db
					.from("organizations_org_keys")
					.select()
					.eq("org_key_id", _.key_id);
				if (_.organization_id) {
					query.eq("organization_id", _.organization_id)
				} else if (_.organization_name) {
					query.eq("organization_name", _.organization_name)
				}
			}
			console.log("%o", await query.maybeSingle())
			return (await query.maybeSingle()).data ? OrganizationAccessRole.owner : OrganizationAccessRole.guest;
		}
		return null;
	}
}
