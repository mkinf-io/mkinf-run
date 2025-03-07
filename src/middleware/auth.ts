import { NextFunction, Request, Response } from 'express';
import KeyType from '../models/enums/KeyType';
import OrgKeysRepository from '../repositories/OrgKeysRepository';

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }

    const authorizationSplit = req.headers.authorization?.split(" ")
    if (authorizationSplit && authorizationSplit.length == 2 && authorizationSplit[0].toLowerCase() == "bearer") {
      req.accessToken = authorizationSplit[1];
    }
    if (!req.accessToken) { return res.status(401).json({ status: 401, message: "Unauthorized" }); }

    const orgKeyRes = await new OrgKeysRepository(req.db).get({ value: req.accessToken });
    if (orgKeyRes.error || !orgKeyRes.data) {
      return res.status(401).json({ status: 401, message: "Unauthorized" });
    }
    req.keyType = KeyType.org;
    req.keyId = orgKeyRes.data.id;
    req.customerId = orgKeyRes.data.organization?.stripe_customer_id ?? undefined;
    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ status: 401, message: "Unauthorized" });
  }
};


export { auth };
