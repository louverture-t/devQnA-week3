const { existsSync } = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const rootDir = __dirname;
const clientPackageJsonPath = path.join(rootDir, "client", "package.json");

const hasClient = existsSync(clientPackageJsonPath);
const scriptToRun = hasClient ? "start:dev:full" : "server:dev";
const npmExecPath = process.env.npm_execpath;
const canRunNpmViaNode = Boolean(npmExecPath && existsSync(npmExecPath));

if (!hasClient) {
  // Keep root `npm run start:dev` usable even when the frontend isn't present.
  console.warn(
    "[devqa-platform] No ./client/package.json found - starting backend only (npm run server:dev)."
  );
}

// On Windows, spawning `npm.cmd` directly can throw `spawn EINVAL` depending on Node/version/shell.
// The most reliable approach is to run npm's CLI JS via Node when available.
// (When invoked via `npm run ...`, `npm_execpath` is set by npm.)
const command = canRunNpmViaNode
  ? process.execPath
  : process.platform === "win32"
    ? "cmd.exe"
    : "npm";

const args = canRunNpmViaNode
  ? [npmExecPath, "run", scriptToRun]
  : process.platform === "win32"
    ? ["/d", "/s", "/c", "npm", "run", scriptToRun]
    : ["run", scriptToRun];

const child = spawn(command, args, {
  cwd: rootDir,
  stdio: "inherit",
});

const forwardSignal = (signal) => () => {
  if (!child.killed) child.kill(signal);
};

process.on("SIGINT", forwardSignal("SIGINT"));
process.on("SIGTERM", forwardSignal("SIGTERM"));

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
