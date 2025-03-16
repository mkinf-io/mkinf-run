import { NextFunction, Request, Response } from 'express';
import { getServiceDatabaseClient } from '../services/supabase';

export default class DB {
	static init = async (req: Request, res: Response, next: NextFunction) => {
		const dbRes = getServiceDatabaseClient();
		if (!dbRes) { return res.status(500).json({ status: 500, message: "Server error" }); }
		req.db = dbRes.unwrap();
		next();
	};
}
