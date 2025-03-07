import { RepositoryId } from '../models/dto/RepositoryId';
import { DatabaseClient } from '../types/databaseExtensions.types';
import { generateOrgSecretKey } from '../utils/generateKey';

export default class OrgKeysRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	list = async (_: { key_id: string }) => {
		return await this.db
			.from("org_keys")
			.select(`
				...organizations(
					id,
					name,
					image,
					keys: org_keys(
						id,
						name,
						value,
						created_at
					)
				)
			`)
			.eq("id", _.key_id);
	}

	get = async (_: { id?: string, value?: string }) => {
		const query = this.db
			.from("org_keys")
			.select(`
				id,
				name,
				value,
				created_at,
				organization: organizations(
					id,
					name,
					image,
					stripe_customer_id
				)
			`);
		if (_.id) { query.eq("id", _.id); }
		if (_.value) { query.eq("value", _.value); }
		return await query.single();
	}

	create = async (_: { name: string, organization_id: string }) => {
		return await this.db
			.from("org_keys")
			.insert({
				name: _.name,
				organization_id: _.organization_id,
				value: generateOrgSecretKey(),
			})
			.select()
			.single();
	}

	delete = async (_: { id: string }) => {
		return await this.db
			.from("org_keys")
			.delete()
			.eq("id", _.id);
	}

	getOrganization = async (_: { key_id: string }) => {
		return await this.db
			.from("org_keys")
			.select(`
				...organizations(
					id,
					name,
					image,
					stripe_customer_id
				)
			`)
			.eq("id", _.key_id); // This "id" filter refers to the keys table
	}

	listRepositories = async (_: { key_id: string, ids?: RepositoryId[], is_private?: boolean, is_hosted?: boolean }) => {
		const query = this.db
			.from("repositories_keys")
			.select(`
				owner: organization_name,
				name,
				description,
				is_private,
				is_hosted,
				runs,
				image,
				created_at
			`);

		if (_.ids) {
			query.or(`key_id.eq.${_.key_id}, is_private.eq.false`)
			query.or(_.ids
				.map((key) => `and(organization_name.eq.${key.owner},name.eq.${key.name})`)
				.join(','))
		} else {
			query.eq("key_id", _.key_id);
		}
		if (_.is_private != null) { query.eq("is_private", _.is_private) }
		if (_.is_hosted != null) { query.eq("is_hosted", _.is_hosted) }
		// DISTINCT data because of multiple keys
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	searchRepositories = async (_: { key_id: string, query: string, limit?: number }) => {
		// Search query in name, owner or description
		const query = this.db
			.from('repositories_keys')
			.select(`
				owner: organization_name,
				name,
				description,
				is_private,
				is_hosted,
				runs,
				image,
				created_at
			`)
			.or(`name.ilike.*${_.query}*, organization_name.ilike.*${_.query}*, description.ilike.*${_.query}*`)
			.or(`key_id.eq.${_.key_id}, is_private.eq.false`);
		// DISTINCT data because of multiple members
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	listFeedRepositories = async (_: { key_id: string }) => {
		const query = this.db
			.from("repositories_keys")
			.select(`
				owner: organization_name,
				name,
				description,
				is_private,
				is_hosted,
				runs,
				image,
				created_at
			`)
			.or(`key_id.eq.${_.key_id}, is_private.eq.false`)
			.order("created_at", { ascending: false });
		// DISTINCT data because of multiple keys
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	listTrendingRepositories = async (_: { key_id: string }) => {
		const query = this.db
			.from("repositories_keys")
			.select(`
				owner: organization_name,
				name,
				description,
				is_private,
				is_hosted,
				runs,
				image,
				created_at
			`)
			.or(`key_id.eq.${_.key_id}, is_private.eq.false`)
			.order("runs", { ascending: false })
			.limit(10);
		// DISTINCT data because of multiple keys
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	listHostedReleases = async (_: { key_id: string, ids?: RepositoryId[] }) => {
		const query = this.db
			.from('repositories_keys')
			.select(`
				owner: organization_name,
				name,
				is_private,
				is_hosted,
				runs,
				releases: hosted_releases(
					version,
					build_number,
					env_variables,
					template_id,
					bootstrap_command,
					runs: runs(count),
					actions: actions(
						action,
						description,
						method,
						input_schema,
						output_schema,
						price_input_mt,
						price_output_mt,
						price_run,
						price_run_second,
						created_at
					),
					created_at
				)
				`)
			.order('build_number', { referencedTable: "hosted_releases", ascending: false })
			.eq("is_hosted", true);
		if (_.ids) {
			query.or(`key_id.eq.${_.key_id}, is_private.eq.false`)
			query.or(_.ids
				.map((key) => `and(organization_name.eq.${key.owner},name.eq.${key.name})`)
				.join(','))
		} else {
			query.eq("key_id", _.key_id);
		}
		// DISTINCT data because of multiple members
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	listRepositoryHostedReleases = async (_: { key_id: string, owner: string, repository: string }) => {
		return await this.db
			.from('repositories_keys')
			.select(`
					hosted_releases(
						owner: organization_name,
						repository: repository_name,
						version,
						build_number,
						env_variables,
						template_id,
						bootstrap_command,
						price_run_second,
						actions: actions(
							action,
							description,
							method,
							input_schema,
							output_schema,
							price_input_mt,
							price_output_mt,
							price_run,
							price_run_second,
							created_at
						),
						created_at
					)
				`)
			.order('build_number', { referencedTable: "hosted_releases", ascending: false })
			.eq("is_hosted", true)
			.eq("organization_name", _.owner)
			.eq("name", _.repository)
			.or(`key_id.eq.${_.key_id}, is_private.eq.false`)
	}

	listRepositoryDailyInsights = async (_: { key_id: string, owner: string, repository: string }) => {
		return await this.db
			.from('repositories_keys')
			.select(`
					owner: organization_name,
					repository: name,
					runs: repository_runs_by_day(
						runs,
						date
					)
				`)
			.eq("organization_name", _.owner)
			.eq("name", _.repository)
			.or(`key_id.eq.${_.key_id}, is_private.eq.false`)
			.limit(1)
			.single()
	}

	listRepositoryMonthlyInsights = async (_: { key_id: string, owner: string, repository: string }) => {
		return await this.db
			.from('repositories_keys')
			.select(`
					owner: organization_name,
					repository: name,
					runs: repository_runs_by_month(
						runs,
						date
					)
				`)
			.eq("organization_name", _.owner)
			.eq("name", _.repository)
			.or(`key_id.eq.${_.key_id}, is_private.eq.false`)
			.limit(1)
			.single()
	}

	async canManageOrgKeys(_: { id: string, user_id?: string, key_id?: string }): Promise<boolean> {
		if (_.user_id) {
			const res = await this.db
				.from("organizations")
				.select(`
					name,
					users_organizations!inner(user_id),
					org_keys!inner(id)
				`)
				.eq("users_organizations.user_id", _.user_id)
				.eq("org_keys.id", _.id)
				.single();
			if (res.error || !res.data) { return false; }
			return true
		} else if (_.key_id) {
			const res = await this.db
				.from("org_keys")
				.select(`
					id,
					organization_id
				`)
				.or(`id.eq.${_.id}, id.eq.${_.key_id}`);
			if (res.error || res.data.length != 2) { return false; }
			const org1 = res.data[0].organization_id;
			const org2 = res.data[1].organization_id;
			return org1 == org2;
		}
		return false;
	}
}
