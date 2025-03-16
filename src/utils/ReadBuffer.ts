import { JSONRPCMessage, JSONRPCMessageSchema } from "@modelcontextprotocol/sdk/types.js";
import stripAnsi from "./stripAnsi";

/**
 * Buffers a continuous stdio stream into discrete JSON-RPC messages.
 */
export class ReadBuffer {
	private _buffer?: Buffer;

	append(chunk: Buffer): void {
		// console.log("Appending chunk:\n", JSON.stringify(chunk.toString("utf8")).magenta);
		this._buffer = Buffer.from(this._buffer ? new Uint8Array([...this._buffer, ...chunk]) : new Uint8Array(chunk));
		// console.log("Buffer after append:\n", JSON.stringify(this._buffer.toString("utf8")).magenta);
	}

	readMessage(): JSONRPCMessage | null {
		if (!this._buffer) {
			return null;
		}

		const index = this._buffer.indexOf("\n");
		if (index === -1) {
			// console.log("Missing newline in:\n", JSON.stringify(this._buffer.toString("utf8")).red);
			return null;
		}

		// console.log("Read line from buffer:\n", JSON.stringify(this._buffer.toString("utf8")).magenta);
		const line = this._buffer.toString("utf8", 0, index);
		// console.log("Read line:\n", JSON.stringify(line).magenta);
		this._buffer = this._buffer.subarray(index + 1);
		// console.log("Buffer after read:\n", JSON.stringify(this._buffer.toString("utf8")).magenta);
		return deserializeMessage(stripAnsi(line));
	}

	clear(): void {
		console.log("Clearing buffer");
		this._buffer = undefined;
	}
}

export function deserializeMessage(line: string): JSONRPCMessage {
	return JSONRPCMessageSchema.parse(JSON.parse(line));
}

export function serializeMessage(message: JSONRPCMessage): string {
	return JSON.stringify(message) + "\n";
}
