const { spawn } = require("node:child_process");
const path = require("node:path");

const reportPath = path.join(__dirname, "client", "playwright-report", "index.html");

console.log(`[devqa-platform] Opening Playwright report: ${reportPath}`);

// Determine the command and args based on OS
let command, args, options;

if (process.platform === "win32") {
  // Windows: Use cmd.exe without shell option to avoid deprecation warning
  command = "cmd.exe";
  args = ["/c", "start", "", reportPath];
  options = { stdio: "ignore", detached: true };
} else if (process.platform === "darwin") {
  // macOS: Use open command
  command = "open";
  args = [reportPath];
  options = { stdio: "ignore", detached: true };
} else {
  // Linux: Use xdg-open command
  command = "xdg-open";
  args = [reportPath];
  options = { stdio: "ignore", detached: true };
}

const child = spawn(command, args, options);

// Detach the child process so it can continue after this script exits
child.unref();

console.log("[devqa-platform] Report opened in default browser");
