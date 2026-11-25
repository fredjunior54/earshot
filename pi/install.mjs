import { spawnSync } from "node:child_process";
import { lstatSync, readlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function launcherTarget(path) {
  try {
    if (!lstatSync(path).isSymbolicLink()) return path;
    return resolve(dirname(path), readlinkSync(path));
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

function install() {
  const home = homedir();
  const agentDir = resolve(
    process.env.PI_CODING_AGENT_DIR?.replace(/^~(?=\/|$)/, home) || join(home, ".pi", "agent"),
  );
  const binDir = join(agentDir, "bin");
  const toolDir = join(binDir, ".earshot-tools");
  const launcher = join(binDir, "earshot");
  const target = launcherTarget(launcher);
  if (target && target !== join(toolDir, "earshot", "bin", "earshot")) {
    throw new Error(`Refusing to replace ${launcher}. Move or uninstall the existing executable first.`);
  }

  for (const [command, flag] of [["uv", "--version"], ["ffmpeg", "-version"]]) {
    const check = spawnSync(command, [flag], { stdio: "ignore" });
    if (check.status !== 0) throw new Error(`Install ${command} and make sure it is available on PATH.`);
  }

  const result = spawnSync(
    "uv", ["tool", "install", "--reinstall-package", "earshot", ".[mcp]"],
    {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      env: { ...process.env, UV_TOOL_DIR: toolDir, UV_TOOL_BIN_DIR: binDir },
      stdio: "inherit",
    },
  );
  if (result.status !== 0) {
    throw new Error(`uv could not install Earshot. Check the uv output above${result.error ? `: ${result.error.message}` : "."}`);
  }
}

try {
  install();
} catch (error) {
  console.error(`Earshot Pi plugin: ${error.message}`);
  process.exitCode = 1;
}
