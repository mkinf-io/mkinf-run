import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import 'colors';
import { CommandExitError, CommandHandle, Sandbox } from 'e2b';
import { Stream } from "stream";
import { CommandsExt } from "../utils/CommandsExt";
import { ReadBuffer, serializeMessage } from "../utils/ReadBuffer";
import stripAnsi from "../utils/stripAnsi";

export type SandboxServerParameters = {
  command: string;
  template_id: string;
  timeout: number;
  args?: string[];
  env?: Record<string, string>;
  stderr?: Stream | number;
  cwd?: string;
  sandboxId?: string;
  pid?: number;
};

export class SandboxClientTransport implements Transport {
  private _abortController: AbortController = new AbortController();
  private _readBuffer: ReadBuffer = new ReadBuffer();
  private _serverParams: SandboxServerParameters;
  private _sandbox?: Sandbox;
  private _commandHandle?: CommandHandle;
  private _needsInitialization: boolean = true;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(server: SandboxServerParameters) {
    this._serverParams = server;
  }

  /**
   * Starts the server process and prepares to communicate with it.
   */
  async start(): Promise<void> {
    console.log("Starting SandboxClientTransport...");
    if (this._sandbox) {
      throw new Error(
        "SandboxClientTransport already started! If using Client class, note that connect() calls start() automatically."
      );
    }
    return new Promise(async (resolve, reject) => {
      if (this._serverParams.sandboxId && this._serverParams.pid) {
        // Connect to an existing sandbox
        try {
          this._sandbox = await Sandbox.connect(this._serverParams.sandboxId);
        } catch (e) {
          return reject(e);
        }
        this._commandHandle = await new CommandsExt(
          (this._sandbox?.commands as any).rpc,
          (this._sandbox?.commands as any).connectionConfig
        ).connectWithData(this._serverParams.pid, {
          onData: (chunk: Uint8Array) => {
            // TODO: Test this
            const textChunk = stripAnsi(new TextDecoder().decode(chunk));
            console.log("OUT CONN:\n", JSON.stringify(textChunk).yellow.bold);
            this._readBuffer.append(Buffer.from(chunk));
            this.processReadBuffer();
          },
          onStderr: (error: string) => {
            // TODO: Test this
            if (error) {
              console.log("ERR:\n", error.red);
              this.onerror?.(Error(error));
            }
          }
        }) as unknown as CommandHandle;
        this._needsInitialization = false;
        resolve();
      } else {
        // Create a new sandbox
        this._sandbox = await Sandbox.create(
          this._serverParams.template_id,
          {
            timeoutMs: this._serverParams.timeout ? this._serverParams.timeout * 1000 : undefined,
            envs: this._serverParams.env ?? undefined
          }
        );

        this._commandHandle = await this._sandbox?.pty.create({
          cols: 80,
          rows: 80,
          user: 'root',
          envs: this._serverParams.env,
          cwd: this._serverParams.cwd,
          timeoutMs: this._serverParams.timeout * 1000,
          onData: async (chunk: Uint8Array) => {
            const textChunk = stripAnsi(new TextDecoder().decode(chunk));
            console.log("OUT:\n", JSON.stringify(textChunk).yellow.bold);
            if (this._needsInitialization) {
              if (textChunk == "~ $ ") {
                console.log("Send command");
                this._sandbox?.pty.sendInput(this._commandHandle?.pid!, new TextEncoder().encode(this._serverParams.command));
                return;
              }
              if (textChunk.includes(this._serverParams.command.trim())) {
                console.log("MCP Ready");
                this._needsInitialization = false;
                resolve();
                return;
              }
            }
            this._readBuffer.append(Buffer.from(chunk));
            this.processReadBuffer();
          },
        });
      }
      this._commandHandle?.wait()
        .then(() => {
          console.log("EXIT");
          if (this._commandHandle?.stderr != undefined && this._commandHandle?.stderr.length > 0) {
            console.log("EXIT THEN ERR");
            console.log("ERR:\n", this._commandHandle?.stderr.red);
            this.onerror?.(Error(this._commandHandle?.stderr))
          }
        }).catch((error) => {
         if(error instanceof CommandExitError){ return }
          console.log("ERR EXIT");
          console.log("ERR:\n", error);
          console.log("STDERR:\n", this._commandHandle?.stderr?.red);
          this.onerror?.(error);
        })
    });
  }

  /**
   * The stderr stream of the child process, if `StdioServerParameters.stderr` was set to "pipe" or "overlapped".
   *
   * This is only available after the process has been started.
   */
  get stderr(): Stream | null {
    if (!this._commandHandle?.stderr) return null;

    // Convert string to stream if needed
    if (typeof this._commandHandle.stderr === 'string') {
      const stream = new Stream.Readable();
      stream.push(this._commandHandle.stderr);
      stream.push(null); // End the stream
      return stream;
    }

    return this._commandHandle.stderr as Stream;
  }

  private processReadBuffer() {
    while (true) {
      try {
        const message = this._readBuffer.readMessage();
        // console.log("PROCESS:\n", JSON.stringify(message).green);
        if (message == null) {
          // console.log("PROCESS:\n", "No message received");
          break;
        }
        // console.log("ON MESSAGE:\n", JSON.stringify(message).green);
        this.onmessage?.(message);
      } catch (error) {
        this.onerror?.(error as Error);
      }
    }
  }

  async detach(): Promise<void> {
    console.log("Detaching SandboxClientTransport");
    this._commandHandle?.disconnect();
    this._sandbox = undefined;
    this._commandHandle = undefined;
    this._readBuffer.clear();
  }

  async close(): Promise<void> {
    console.log("Closing SandboxClientTransport");
    this._abortController.abort();
    await this._commandHandle?.kill();
    await this._sandbox?.kill();
    this._sandbox = undefined;
    this._commandHandle = undefined;
    this._readBuffer.clear();
  }

  send(message: JSONRPCMessage): Promise<void> {
    return new Promise(async (resolve) => {
      if (!this._sandbox || !this._commandHandle) {
        throw new Error("Not connected");
      }
      const json = serializeMessage(message);
      console.log("IN:\n", JSON.stringify(json).blue.bold);
      const encodedJson = new TextEncoder().encode(json);
      try {
        await this._sandbox?.pty.sendInput(this._commandHandle?.pid, encodedJson);
        resolve();
      } catch (error) {
        console.error("Failed to send message:", error);
        resolve();
      }
    });
  }

  get sandboxId(): string {
    if (!this._sandbox) {
      throw new Error("Not connected");
    }
    return this._sandbox.sandboxId;
  }

  get pid(): number {
    if (!this._commandHandle) {
      throw new Error("Not connected");
    }
    return this._commandHandle.pid;
  }
}
