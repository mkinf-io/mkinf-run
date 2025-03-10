import Stripe from "stripe";
import KeyType from "../models/enums/KeyType";
import { DatabaseClient } from "./databaseExtensions.types";

declare global {
	namespace Express {
		interface Request {
			stripe: Stripe;
			db?: DatabaseClient;
			customerId?: string;
			accessToken?: string;
			keyId?: string;
			key?: string;
			keyType?: KeyType;
			userId?: string;
			providerProjectId?: string;
			hyperstackAPIKey?: string;
		}
	}
}
