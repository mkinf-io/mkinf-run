import { DatabaseClient } from '../types/databaseExtensions.types';

export default class RunSessionsRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	create = async (_: {
		key_id: string,
		organization_name: string,
		repository_name: string,
		build_number: number,
		sandbox_id: string,
		pid: number,
		price_run_second: number,
	}) => {
		return await this.db
			.from("run_sessions")
			.insert({
				org_key_id: _.key_id,
				organization_name: _.organization_name,
				repository_name: _.repository_name,
				build_number: _.build_number,
				sandbox_id: _.sandbox_id,
				pid: _.pid,
				price_run_second: _.price_run_second,
			})
			.select()
			.single();
	}

	get = async (_: {
		key_id: string,
		id: string,
	}) => {
		return await this.db
			.from("run_sessions")
			.select()
			.eq("org_key_id", _.key_id)
			.eq("id", _.id)
			.single();
	}

	close = async (_: {
		key_id: string,
		id: string
	}) => {
		return await this.db
			.from("run_sessions")
			.update({
				closed_at: new Date().toISOString(),
			})
			.eq("org_key_id", _.key_id)
			.eq("id", _.id)
			.select()
			.single();
	}

	updateLastRun = async (_: {
		key_id: string,
		id: string,
		last_run_at: Date,
	}) => {
		return await this.db
			.from("run_sessions")
			.update({
				last_run_at: _.last_run_at.toISOString(),
			})
			.eq("org_key_id", _.key_id)
			.eq("id", _.id)
			.select()
			.single();
	}
}