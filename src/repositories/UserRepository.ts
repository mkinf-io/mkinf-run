import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { RepositoryId } from '../models/dto/RepositoryId';
import { DatabaseClient } from '../types/databaseExtensions.types';

export default class UserRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	signIn = async (_: { email: string, password: string }) => {
		return await this.db.auth.signInWithPassword({
			email: _.email,
			password: _.password,
		});
	}

	signUp = async (_: { email: string, password: string }) => {
		return await this.db.auth.signUp({
			email: _.email,
			password: _.password
		});
	}

	createProfile = async (_: {
		user_id: string,
		handle: string,
		full_name: string,
		image?: string,
		website_url?: string
	}) => {
		return await this.db
			.from('user_profiles')
			.insert({
				user_id: _.user_id,
				full_name: _.full_name,
				handle: _.handle,
				image: _.image,
				website_url: _.website_url
			})
			.select()
			.single();
	}

	updateProfile = async (_: {
		user_id: string,
		handle?: string,
		full_name?: string,
		image?: string,
		website_url?: string
	}) => {
		return await this.db
			.from('user_profiles')
			.update({
				full_name: _.full_name,
				handle: _.handle,
				image: _.image,
				website_url: _.website_url
			})
			.eq('user_id', _.user_id)
			.select()
			.single();
	}

	refreshAccessToken = async (_: { refreshToken: string }) => {
		return await this.db.auth.refreshSession({ refresh_token: _.refreshToken });
	}

	changePassword = async (_: { password: string }) => {
		return await this.db.auth.updateUser({ password: _.password });
	}

	requestPasswordReset = async (_: { email: string }) => {
		return await this.db.auth.resetPasswordForEmail(_.email);
	}

	getIdFromJWT = async (jwt: string): Promise<string | undefined> => {
		// FIXME: Do it locally decrypting the JWT
		const userRes = await this.db.auth.getUser(jwt);
		const userId = userRes.data.user?.id;
		if (userRes.error || !userId) { return }
		return userId;
	}

	async getProfile(_: { id: string }): Promise<PostgrestSingleResponse<{
		id: string | null;
		email: string | null;
		profile: {
			handle: string;
			full_name: string;
			image: string | null;
			website_url: string | null;
			created_at: string;
		} | null;
	}>>;
	async getProfile(_: { handle: string }): Promise<PostgrestSingleResponse<{
		id: string | null;
		email: string | null;
		profile: {
			handle: string;
			full_name: string;
			image: string | null;
			website_url: string | null;
			created_at: string;
		} | null;
	}>>;
	async getProfile(_: { id?: string, handle?: string }) {
		const query = this.db
			.from('users')
			.select(`
				id,
				email,
				profile: user_profiles(
					handle,
					full_name,
					image,
					website_url,
					created_at
				)
			`)
		if (_.id) { query.eq('id', _.id); }
		if (_.handle) { query.eq('user_profiles.handle', _.handle) }
		return await query.maybeSingle();
	}

	async getProfileWithRepositories(_: { handle: string, asGuest: boolean }) {
		const query = this.db
			.from('users')
			.select(`
				id,
				email,
				...user_profiles!inner(
					handle,
					full_name,
					image,
					website_url,
					created_at
				),
				organizations: users_organizations(
					...organizations(
						name,
						image,
						repositories: repositories_members(
							owner: organization_name,
							name,
							description,
							image,
							is_private,
							is_hosted,
							runs,
							created_at
						)
					)
				)
			`)
			.eq('user_profiles.handle', _.handle)
		if (_.asGuest == true) query.eq("users_organizations.organizations.repositories.is_private", false)
		return await query.maybeSingle();
	}

	listOrganizations = async (_: { user_id: string }) => {
		return await this.db
			.from('users_organizations')
			.select(`
				...organizations(
					id,
					name,
					image,
					stripe_customer_id
				)
			`)
			.eq('user_id', _.user_id);
	}

	listOrganizationKeys = async (_: { user_id: string }) => {
		return await this.db
			.from('users_organizations')
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
			.eq('user_id', _.user_id);
	}

	listProjects = async (_: { user_id: string }) => {
		return await this.db
			.from('users_organizations')
			.select(`
				...organizations(
					projects(
						id,
						organization_id,
						name,
						version
					)
				)
			`)
			.eq('user_id', _.user_id);
	}

	listRepositories = async (_: { user_id: string, ids?: RepositoryId[], is_private?: boolean, is_hosted?: boolean, limit?: number }) => {
		const query = this.db
			.from('repositories_members')
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
			query.or(`member.eq.${_.user_id}, is_private.eq.false`)
			query.or(_.ids
				.map((key) => `and(organization_name.eq.${key.owner},name.eq.${key.name})`)
				.join(','))
		} else {
			query.eq("member", _.user_id);
		}
		if (_.is_private != null) { query.eq("is_private", _.is_private) }
		if (_.is_hosted != null) { query.eq("is_hosted", _.is_hosted) }
		if (_.limit) { query.limit(_.limit) }
		// DISTINCT data because of multiple members
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	searchRepositories = async (_: { user_id: string, query: string, limit?: number }) => {
		// Search query in name, owner or description with a textSearch
		const query = this.db
			.from('repositories_members')
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
			.or(`member.eq.${_.user_id}, is_private.eq.false`);
		if (_.limit != undefined) { query.limit(_.limit) }
		// DISTINCT data because of multiple members
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	listFeedRepositories = async (_: { user_id: string }) => {
		const query = this.db
			.from('repositories_members')
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
			.or(`member.eq.${_.user_id}, is_private.eq.false`)
			.order("created_at", { ascending: false });
		// DISTINCT data because of multiple members
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	listTrendingRepositories = async (_: { user_id: string }) => {
		const query = this.db
			.from('repositories_members')
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
			.or(`member.eq.${_.user_id}, is_private.eq.false`)
			.order("runs", { ascending: false })
			.limit(10);
		// DISTINCT data because of multiple members
		const res = await query;
		if (!res.data) { return res }
		const distinctData = [
			...new Map(res.data.map(item => [`${item.owner}-${item.name}`, item])).values()
		]
		res.data = distinctData;
		return res;
	}

	listHostedReleases = async (_: { user_id: string, ids?: RepositoryId[] }) => {
		const query = this.db
			.from('repositories_members')
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
			query.or(`member.eq.${_.user_id}, is_private.eq.false`)
			query.or(_.ids
				.map((key) => `and(organization_name.eq.${key.owner},name.eq.${key.name})`)
				.join(','))
		} else {
			query.eq("member", _.user_id);
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

	listRepositoryHostedReleases = async (_: { user_id: string, owner: string, repository: string }) => {
		return await this.db
			.from('repositories_members')
			.select(`
					hosted_releases(
						owner: organization_name,
						repository: repository_name,
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
			.eq("is_hosted", true)
			.eq("organization_name", _.owner)
			.eq("name", _.repository)
			.or(`member.eq.${_.user_id}, is_private.eq.false`)
	}

	listRepositoryDailyInsights = async (_: { user_id: string, owner: string, repository: string }) => {
		return await this.db
			.from('repositories_members')
			.select(`
					owner: organization_name,
					repository: name,
					runs: repository_runs_by_day(
						action,
						runs,
						date
					)
				`)
			.eq("organization_name", _.owner)
			.eq("name", _.repository)
			.or(`member.eq.${_.user_id}, is_private.eq.false`)
			.limit(1)
			.single()
	}

	listRepositoryMonthlyInsights = async (_: { user_id: string, owner: string, repository: string }) => {
		return await this.db
			.from('repositories_members')
			.select(`
					owner: organization_name,
					repository: name,
					runs: repository_runs_by_month(
						action,
						runs,
						date
					)
				`)
			.eq("organization_name", _.owner)
			.eq("name", _.repository)
			.or(`member.eq.${_.user_id}, is_private.eq.false`)
			.limit(1)
			.single()
	}
}
