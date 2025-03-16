import { Request, Response } from 'express';

const notImplemented = async (_req: Request, res: Response) => {
	try {
		return res.status(501).json({ status: 501, message: 'Route not found' });
	} catch (error) {
		return res.status(500).json({ status: 500, message: "Server error" });
	}
};

export { notImplemented };
