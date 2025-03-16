import { Request, Response } from 'express';

const allRoot = async (req: Request, res: Response) => {
	res.status(200).json({ status: 200, message: "mkinf run API 👾" });
};

export { allRoot };
