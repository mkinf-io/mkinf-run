import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

export default class MCPClient extends Client {
  async connectWithoutInit(transport: Transport): Promise<void> {
    await Object.getPrototypeOf(Client.prototype).connect.call(this, transport);
    await this.notification({
      method: "notifications/initialized",
    });
  }
}
