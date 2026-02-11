/**
 * Env check: validasi variabel environment yang dipakai di backend (Go + JS).
 * Use: npm run env:check
 */
const required = ["PORT"];
const optional = ["ENV", "API_URL", "DATABASE_URL"];

function main() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.warn("Missing recommended env (Go API uses defaults if absent):", missing);
  } else {
    console.log("Required env present.");
  }
  console.log(
    "Optional env:",
    optional.map((k) => (process.env[k] ? `${k}=***` : `${k}=(not set)`)).join(", ")
  );
}

main();
