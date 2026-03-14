import { spawnSync } from "node:child_process";

function run(command, args, allowFail = false) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (!allowFail && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with code ${result.status}`);
  }
}

try {
  console.log("Starting local Supabase stack...");
  run("pnpm", ["exec", "supabase", "start"]);

  console.log("Resetting local database (migrations + seed)...");
  run("pnpm", ["exec", "supabase", "db", "reset", "--local"]);

  console.log("Running RLS SQL test plan...");
  run("pnpm", [
    "exec",
    "supabase",
    "db",
    "execute",
    "--local",
    "--file",
    "supabase/tests/rls_test_plan.sql",
  ]);

  console.log("RLS test plan completed successfully.");
} finally {
  run("pnpm", ["exec", "supabase", "stop", "--no-backup"], true);
}
