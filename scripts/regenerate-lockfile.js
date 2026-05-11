import { execSync } from "child_process";
console.log("Regenerating pnpm-lock.yaml...");
execSync("pnpm install --no-frozen-lockfile", { stdio: "inherit", cwd: "/vercel/share/v0-project" });
console.log("Done!");
