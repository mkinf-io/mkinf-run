import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse";
import { Request, Response } from 'express';
import MCPClient from '../../models/MCPClient';
import HostedReleasesRepository from '../../repositories/HostedReleasesRepository';
import { SandboxClientTransport } from '../../services/SandboxClientTransport';

// Store multiple transports per client
const sseTransports = new Map<string, SSEServerTransport>();

// GET /:owner/:repo/:action/sse
export const sse = async (req: Request, res: Response) => {
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
		// const inputTokens = countTokens(JSON.stringify(req.body.args));
		// Set up SSE transport
		console.log("Messages path:", `${req.path}/messages`);
		const sseTransport = new SSEServerTransport(`${req.path}/messages`, res);
		const sessionId = sseTransport.sessionId;
		console.log("Session id:", sessionId);
		sseTransports.set(sessionId, sseTransport);
		// Create a new SandboxClientTransport instance
		const transport = new SandboxClientTransport({
			command: `cd /${latestRelease.repository} && stty -echo && ${latestRelease.bootstrap_command}\n`,
			template_id: latestRelease.template_id,
			timeout: +(req.query.timeout ?? 60),
			env: req.query.env ? JSON.parse(req.query.env.toString()) : {}
		});
		// Set up event listeners
		transport.onmessage = (message) => { sseTransport.onmessage?.(message); };
		transport.onclose = () => {
			console.log(`Transport ${sessionId} closed`);
			transport.close();
			sseTransport.close();
			sseTransports.delete(sessionId);
		};
		transport.onerror = (error) => { sseTransport.onerror?.(error); };
		// Create a new MCPClient instance
		const client = new MCPClient({ name: "mkinf-client", version: req.body.client_version ?? "1.0.0" });
		// Start timer
		const startTimer = Date.now();
		// Connect to the sandbox with initialization
		await client.connectWithoutInit(transport);
		// End timer
		const endTimer = Date.now();
		const duration = endTimer - startTimer;
		console.log(`Connected ${sessionId} to sandbox in ${duration}ms`);
		// Listen for client disconnection
		req.on("close", async () => {
			console.log(`Client disconnected: ${sessionId}`);
			transport.close();
			sseTransport.close();
			sseTransports.delete(sessionId);
			console.log(`Deleted session ${sessionId} from database`);
		});
	} catch (error) {
		console.log("Error", error);
		res.status(500).json({ status: 500, message: "Server error" });
	}
}

// POST /:owner/:repo/:action/messages?session_id=:sessionId
export const messages = async (req: Request, res: Response) => {
	const { sessionId } = req.query;
	if (!sessionId) { return res.status(400).send("Missing sessionId"); }
	const transport = sseTransports.get(sessionId.toString());
	if (!transport) { return res.status(404).send(`No active SSE transport for sessionId: ${sessionId}`); }
	transport.handlePostMessage(req, res);
}
