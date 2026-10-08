import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAgentMcpServer } from "./agent";

const server = createAgentMcpServer();
await server.connect(new StdioServerTransport());
