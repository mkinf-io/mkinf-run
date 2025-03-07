import { DatabaseClient } from '../types/databaseExtensions.types';

export default class PricesRepository {
	db: DatabaseClient;

	constructor(db: DatabaseClient) {
		this.db = db;
	}

	get = async (_: { gpu_model: string }) => {
		return await this.db
			.from("prices")
			.select()
			.eq("gpu_model", _.gpu_model)
			.maybeSingle();
	}
	
	list = async () => {
		return await this.db
			.from("prices")
			.select()
	}
}
