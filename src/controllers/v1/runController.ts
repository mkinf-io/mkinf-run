import { Request, Response } from 'express';
import MCPClient from "../../models/MCPClient";
import HostedReleasesRepository from "../../repositories/HostedReleasesRepository";
import RunsRepository from "../../repositories/RunsRepository";
import { SandboxClientTransport } from '../../services/SandboxClientTransport';
import countTokens from "../../utils/countTokens";

// GET /:owner/:repo
export const listToolsOnce = async (req: Request, res: Response) => {
	try {
		if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }
		if (!req.keyId) { return res.status(400).json({ status: 400, message: "Missing key ID" }); }
		// Get the latest release for the repository
		// TODO: Check version
		const latestReleaseRes = await new HostedReleasesRepository(req.db).getLatest({
			key_id: req.keyId,
			owner: req.params.owner,
			repository: req.params.repo,
		});
		if (latestReleaseRes.error || !latestReleaseRes.data) { return res.status(404).json({ status: 404, message: "Repository not found" }); }
		const latestRelease = latestReleaseRes.data;
		if (!latestRelease.bootstrap_command) { return res.status(500).json({ status: 500, message: "Missing bootstrap command" }); }
		if (!latestRelease.template_id) { return res.status(500).json({ status: 500, message: "Missing template ID" }); }
		// Create a new SandboxClientTransport instance
		const transport = new SandboxClientTransport({
			command: `cd /${latestRelease.repository} && stty -echo && ${latestRelease.bootstrap_command}\n`,
			template_id: latestRelease.template_id,
			timeout: req.body.timeout ?? 20,
			env: req.body.env
		});
		// Create a new MCPClient instance
		const client = new MCPClient({ name: "mkinf-client", version: req.body.client_version ?? "1.0.0" });
		// Start timer
		const startTimer = Date.now();
		// Connect to the sandbox without MCP initialization
		await client.connectWithoutInit(transport);
		// List available tools
		const result = await client.listTools();
		// Close the client connection
		await client.close();
		// End timer
		const endTimer = Date.now();
		const duration = endTimer - startTimer;
		// Count output tokens
		const outputTokens = countTokens(JSON.stringify(result));
		// Log the run on db
		const runLog = {
			key_id: req.keyId,
			owner: req.params.owner,
			repo: req.params.repo,
			build_number: latestRelease.build_number,
			action: "list_tools",
			run_seconds: duration / 1000,
			price_run_second: 0, // TODO: For now listing tools is free
			price_run: undefined, // TODO: For now listing tools is free
			price_input_mt: undefined, // TODO: For now listing tools is free
			price_output_mt: undefined, // TODO: For now listing tools is free
			input_tokens: 0, // TODO: For now listing tools is free
			output_tokens: outputTokens,
		}
		new RunsRepository(req.db).create(runLog);
		return res.status(200).json({ status: 200, data: result, duration });
	} catch (error) {
		console.log("Error", error);
		res.status(500).json({ status: 500, message: "Server error" });
	}
}

// POST /:owner/:repo/:action
export const runActionOnce = async (req: Request, res: Response) => {
	try {
		if (!req.db) { return res.status(500).json({ status: 500, message: "Server error" }); }
		if (!req.keyId) { return res.status(400).json({ status: 400, message: "Missing key ID" }); }
		// Get the latest release for the repository
		// TODO: Check version
		const latestReleaseRes = await new HostedReleasesRepository(req.db).getLatest({
			key_id: req.keyId,
			owner: req.params.owner,
			repository: req.params.repo,
		});
		if (latestReleaseRes.error || !latestReleaseRes.data) { return res.status(404).json({ status: 404, message: "Repository not found" }); }
		const latestRelease = latestReleaseRes.data;
		if (!latestRelease.bootstrap_command) { return res.status(500).json({ status: 500, message: "Missing bootstrap command" }); }
		if (!latestRelease.template_id) { return res.status(500).json({ status: 500, message: "Missing template ID" }); }
		// Check if the action exists
		const action = latestRelease.actions.find((e) => e.action == req.params.action);
		if (!action) { return res.status(404).json({ status: 404, message: "Action not found" }); }
		// Count input tokens
		const inputTokens = countTokens(JSON.stringify(req.body.args));
		// Create a new SandboxClientTransport instance
		const transport = new SandboxClientTransport({
			command: `cd /${latestRelease.repository} && stty -echo && ${latestRelease.bootstrap_command}\n`,
			template_id: latestRelease.template_id,
			timeout: req.body.timeout ?? 60,
			env: req.body.env
		});
		// Create a new MCPClient instance
		const client = new MCPClient({ name: "mkinf-client", version: req.body.client_version ?? "1.0.0" });
		// Start timer
		const startTimer = Date.now();
		// Connect to the sandbox with initialization
		await client.connectWithoutInit(transport);
		// Call the tool
		const result = await client.callTool({ name: action.action, arguments: req.body.args });
		// Close the client connection
		await client.close();
		// End timer
		const endTimer = Date.now();
		const duration = endTimer - startTimer;
		// Count output tokens
		const outputTokens = countTokens(JSON.stringify(result));
		// Log run on db
		const runLog = {
			key_id: req.keyId,
			owner: req.params.owner,
			repo: req.params.repo,
			build_number: latestRelease.build_number,
			action: action.action,
			run_seconds: duration / 1000,
			price_run_second: action.price_run_second ?? undefined,
			price_run: action.price_run ?? undefined,
			price_input_mt: action.price_input_mt ?? undefined,
			price_output_mt: action.price_output_mt ?? undefined,
			input_tokens: inputTokens,
			output_tokens: outputTokens,
		};
		new RunsRepository(req.db).create(runLog);
		return res.status(200).json({ status: 200, data: result, duration });
	} catch (error) {
		console.log("Error", error);
		res.status(500).json({ status: 500, message: "Server error" });
	}
}
