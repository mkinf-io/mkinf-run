import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Request, Response } from 'express';
import MCPClient from '../../models/MCPClient';
import HostedReleasesRepository from '../../repositories/HostedReleasesRepository';
import { SandboxClientTransport } from '../../services/SandboxClientTransport';

// Store multiple transports per client
const transports = new Map<string, { sseTransport: SSEServerTransport, sbxTransport: SandboxClientTransport }>();

// GET /:owner/:repo/sse
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
		// Set up SSE transport
		const messagePath = `/v1/${req.params.owner}/${req.params.repo}/messages`;
		console.log("Messages path:", messagePath);
		const sseTransport = new SSEServerTransport(messagePath, res);
		const sessionId = sseTransport.sessionId;
		console.log("Session id:", sessionId);
		// Create a new SandboxClientTransport instance
		const sbxTransport = new SandboxClientTransport({
			command: `cd /${latestRelease.repository} && stty -echo && ${latestRelease.bootstrap_command}\n`,
			template_id: latestRelease.template_id,
			timeout: +(req.query.timeout ?? 600),
			env: req.query.env ? JSON.parse(req.query.env.toString()) : {}
		});
		transports.set(sessionId, { sseTransport: sseTransport, sbxTransport: sbxTransport });
		// Create a new MCPClient instance
		const client = new MCPClient({ name: "mkinf-client", version: "1.0.0" });
		// Start timer
		const startTimer = Date.now();
		// Connect to the sandbox with initialization
		await client.connectWithoutInit(sbxTransport);
		// Set up event listeners
		sbxTransport.onmessage = (message) => {
			console.log("Send message to sse:", message);
			sseTransport.send(message);
		};
		sbxTransport.onclose = () => {
			console.log(`Transport ${sessionId} closed from sbx`);
			transports.delete(sessionId);
		};
		sbxTransport.onerror = (error) => {
			console.error("Transport error:", error);
		};
		sseTransport.onmessage = async (message) => {
			console.log("Send message to sbx:", message);
			sbxTransport.send(message);
		};
		sseTransport.onclose = async () => {
			console.log(`Transport ${sessionId} closed from sse`);
			transports.delete(sessionId);
		};
		sseTransport.onerror = (error) => {
			console.error("Transport error:", error);
		};
		// Start the SSE stream
		await sseTransport.start();
		// End timer
		const endTimer = Date.now();
		const duration = endTimer - startTimer;
		console.log(`Connected ${sessionId} to sandbox in ${duration}ms`);
		// Listen for client disconnection
		req.on("close", async () => {
			console.log(`Client disconnected: ${sessionId}`);
			sbxTransport.close();
			sseTransport.close();
			transports.delete(sessionId);
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
	const { sseTransport, sbxTransport } = transports.get(sessionId.toString()) ?? {};
	if (!sseTransport || !sbxTransport) { return res.status(404).send(`No active SSE transport for sessionId: ${sessionId}`); }
	console.log("Received POST request for messages");
	await sseTransport.handlePostMessage(req, res);
}
