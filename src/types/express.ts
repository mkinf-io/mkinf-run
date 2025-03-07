import Stripe from "stripe";
import OrganizationAccessRole from "../models/enums/hub/OrganizationAccessRole";
import RepositoryAccessRole from "../models/enums/hub/RepositoryAccessRole";
import UserProfileAccessRole from "../models/enums/hub/UserProfileAccessRole";
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
			userProfileAccessRole?: UserProfileAccessRole;
			organizationAccessRole?: OrganizationAccessRole;
			repositoryAccessRole?: RepositoryAccessRole;
			providerProjectId?: string;
			hyperstackAPIKey?: string;
		}
	}
}
