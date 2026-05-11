import { execSync } from "child_process";
console.log("Regenerating pnpm-lock.yaml...");
execSync("cd /vercel/share/v0-project && pnpm install --no-frozen-lockfile", { stdio: "inherit" });
console.log("Done.");
