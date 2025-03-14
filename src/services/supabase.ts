import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { DatabaseClient } from '../types/databaseExtensions.types';
import { Result } from '../utils/Result';

const getServiceDatabaseClient = (): Result<DatabaseClient, string> => {
	if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) { return Result.err("Missing env"); }
	const client = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
	return Result.ok(client);
}

const getDatabaseClient = (p: { accessToken?: string }): Result<DatabaseClient, string> => {
	if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) { return Result.err("Missing env"); }
	const db = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false },
		global: {
			headers: p.accessToken ? {
				Authorization: `Bearer ${p.accessToken}`,
			} : {},
		},
	});
	return Result.ok(db);
}

export { getDatabaseClient, getServiceDatabaseClient };

