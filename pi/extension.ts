import { join } from "node:path";
import { getAgentDir, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function earshot(pi: ExtensionAPI) {
  pi.registerMcpServer("earshot", {
    command: join(getAgentDir(), "bin", "earshot"),
    args: ["mcp"],
    description: "Generate and work with sound effects using the local Earshot installation.",
  });
}
