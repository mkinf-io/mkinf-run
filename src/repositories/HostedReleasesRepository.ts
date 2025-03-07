import { DatabaseClient } from '../types/databaseExtensions.types';

export default class HostedReleasesRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	async list(_: { key_id: string, owner: string, repository: string }) {
		const res = await this.db
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
		return {
			...res,
			data: res.data?.[0]["hosted_releases"]
		}
	}

	async get(_: { key_id: string, owner: string, repository: string, version?: string, build_number?: number }) {
		if (!_.build_number && !_.version) { throw new Error('build_number or version is required'); }
		let query = this.db
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
			.eq("is_hosted", true)
			.eq("organization_name", _.owner)
			.eq("name", _.repository)
			.or(`key_id.eq.${_.key_id}, is_private.eq.false`);
		if (_.build_number) { query.eq("hosted_releases.build_number", _.build_number); }
		if (_.version) {
			query.eq("hosted_releases.version", _.version)
				.order('build_number', { referencedTable: "hosted_releases", ascending: false })
				.single();
		}
		const res = await query;
		return {
			...res,
			data: res.data?.[0]["hosted_releases"][0]
		}
	}

	async getLatest(_: { key_id: string, owner: string, repository: string }) {
		const res = await this.db
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
			.or(`key_id.eq.${_.key_id}, is_private.eq.false`);
		return {
			...res,
			data: res.data?.[0]["hosted_releases"][0]
		}
	}
}
