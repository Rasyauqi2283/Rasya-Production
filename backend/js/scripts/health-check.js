/**
 * Health check script: hits the Go API /health endpoint.
 * Use: npm run health (set API_URL or default http://localhost:8080)
 */
const API_URL = process.env.API_URL || "http://localhost:8080";

async function main() {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    if (res.ok) {
      console.log("OK", data);
      process.exit(0);
    } else {
      console.error("Health check failed:", res.status, data);
      process.exit(1);
    }
  } catch (err) {
    console.error("Request failed:", err.message);
    process.exit(1);
  }
}

main();
