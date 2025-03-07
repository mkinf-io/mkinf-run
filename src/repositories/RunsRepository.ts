import { DatabaseClient } from '../types/databaseExtensions.types';

export default class RunsRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	create = async (_: {
		key_id: string,
		owner: string,
		repo: string,
		build_number: number,
		action: string,
		run_seconds?: number,
		price_run_second?: number,
		price_run?: number,
		price_input_mt?: number,
		price_output_mt?: number,
		input_tokens: number,
		output_tokens?: number,
	}) => {
		return await this.db
			.from("runs")
			.insert({
				action: _.action,
				key_id: _.key_id,
				organization_name: _.owner,
				repository_name: _.repo,
				build_number: _.build_number,
				price_run_second: _.price_run_second,
				price_run: _.price_run,
				price_input_mt: _.price_input_mt,
				price_output_mt: _.price_output_mt,
				run_seconds: _.run_seconds,
				input_tokens: _.input_tokens,
				output_tokens: _.output_tokens,
			});
	}
}
