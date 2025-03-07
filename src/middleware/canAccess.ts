import { NextFunction, Request, Response } from 'express';
import OrganizationsRepository from '../repositories/OrganizationsRepository';
import OrgKeysRepository from '../repositories/OrgKeysRepository';
import ProjectsRepository from '../repositories/ProjectsRepository';
import RepositoriesRepository from '../repositories/RepositoriesRepository';

export const canAccessProject = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }
		if (!req.params.projectId) { return res.status(400).json({ status: 400, message: "Bad request - projectId" }); }
		const projectRepository = new ProjectsRepository(req.db);
		const canAccess = await projectRepository.canAccess({
			project_id: req.params.projectId,
			user_id: req.userId,
			key_id: req.keyId
		});
		if (!canAccess) { return res.status(403).json({ status: 403, message: "Forbidden" }); }
		const providerProjectId = await projectRepository.getProviderId({ id: req.params.projectId });
		if (!providerProjectId) { return res.status(403).json({ status: 403, message: "Forbidden" }); }
		req.providerProjectId = providerProjectId;
		return next();
	} catch (error) {
		console.error(error);
		return res.status(401).json({ status: 401, message: "Unauthorized" });
	}
};

export const canAccessUserProfile = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }
		if (!req.params.handle) { return res.status(400).json({ status: 400, message: "Bad request - missing user handle" }); }
		const repositoryRepository = new RepositoriesRepository(req.db);
		let userProfileAccessRole = await repositoryRepository.getUserProfileAccessRole({
			user_handle: req.params.handle,
			user_id: req.userId,
			key_id: req.keyId
		});
		req.userProfileAccessRole = userProfileAccessRole ?? undefined;
		return next();
	} catch (error) {
		console.error(error);
		return res.status(401).json({ status: 401, message: "Unauthorized" });
	}
};

export const getOrganizationAccessRole = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }
		if (!req.params.organizationIdOrName) { return res.status(400).json({ status: 400, message: "Bad request - missing organizationIdOrName" }); }
		let organizationProfileAccessRole;
		const organizationRepository = new OrganizationsRepository(req.db);
		const byOrganizationId = req.params.organizationIdOrName.length == 36 && req.params.organizationIdOrName.split("-").length == 5;
		if(byOrganizationId) {
			// organizationIdOrName is an id
			organizationProfileAccessRole = await organizationRepository.getOrganizationProfileAccessRole({
				organization_id: req.params.organizationIdOrName,
				user_id: req.userId,
				key_id: req.keyId,
				key_type: req.keyType
			});
		} else {
			// organizationIdOrName is a name/handle
			organizationProfileAccessRole = await organizationRepository.getOrganizationProfileAccessRole({
				organization_name: req.params.organizationIdOrName,
				user_id: req.userId,
				key_id: req.keyId,
				key_type: req.keyType
			});
		}
		req.organizationAccessRole = organizationProfileAccessRole ?? undefined;
		return next();
	} catch (error) {
		console.error(error);
		return res.status(401).json({ status: 401, message: "Unauthorized" });
	}
};

// FIXME: Remove this, is a duplicate of getOrganizationAccessRole, just works with "owner" instead of "organizationIdOrName"
export const getOrganizationAccessRoleByOwner = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }
		if (!req.params.owner) { return res.status(400).json({ status: 400, message: "Bad request - missing owner" }); }
		let organizationProfileAccessRole = await new OrganizationsRepository(req.db).getOrganizationProfileAccessRole({
			organization_name: req.params.owner,
			user_id: req.userId,
			key_id: req.keyId,
			key_type: req.keyType
		});
		req.organizationAccessRole = organizationProfileAccessRole ?? undefined;
		return next();
	} catch (error) {
		console.error(error);
		return res.status(401).json({ status: 401, message: "Unauthorized" });
	}
};

export const canManageOrgKeys = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }
		if (!req.params.id) { return res.status(400).json({ status: 400, message: "Bad request - missing keyId" }); }
		const canAccess = await new OrgKeysRepository(req.db).canManageOrgKeys({
			id: req.params.id,
			user_id: req.userId,
			key_id: req.keyId
		});
		if (!canAccess) { return res.status(403).json({ status: 403, message: "Forbidden" }); }
		return next();
	} catch (error) {
		console.error(error);
		return res.status(401).json({ status: 401, message: "Unauthorized" });
	}
}

export const getRepositoryAccessRole = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }
		if (!req.params.repository) { return res.status(400).json({ status: 400, message: "Bad request - missing repository" }); }
		if (!req.params.owner) { return res.status(400).json({ status: 400, message: "Bad request - missing owner" }); }
		let repositoryAccessRole = await new RepositoriesRepository(req.db).getRepositoryAccessRole({
			organization_name: req.params.owner,
			repository_name: req.params.repository,
			user_id: req.userId,
			key_id: req.keyId
		});
		if (repositoryAccessRole == null) { return res.status(403).json({ status: 403, message: "Forbidden" }); }
		req.repositoryAccessRole = repositoryAccessRole;
		return next();
	} catch (error) {
		console.error(error);
		return res.status(401).json({ status: 401, message: "Unauthorized" });
	}
};