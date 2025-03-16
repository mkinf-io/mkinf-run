import { Request, Response } from 'express';

const welcome = (req: Request, res: Response) => {
	res.status(200).json({ status: 200, message: "mkinf run API v1 👾" });
}

export { welcome };
