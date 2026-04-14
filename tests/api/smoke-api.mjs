const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080/api/v1";
const HEALTH_URL = process.env.HEALTH_URL ?? "http://localhost:8080/actuator/health";
const ADMIN_EMAIL = process.env.API_ADMIN_EMAIL ?? "admin@inventario.local";
const ADMIN_PASSWORD = process.env.API_ADMIN_PASSWORD ?? "Admin123!";
const REQUEST_TIMEOUT_MS = Number(process.env.API_REQUEST_TIMEOUT_MS ?? 30000);

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    return { response, body };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkHealth() {
  const { response, body } = await requestJson(HEALTH_URL, { method: "GET" });
  assertCondition(response.ok, `Health check failed (${response.status}). URL: ${HEALTH_URL}`);
  if (body && typeof body === "object" && "status" in body) {
    assertCondition(
      String(body.status).toUpperCase() === "UP",
      `Expected actuator status UP, got: ${String(body.status)}`
    );
  }
}

async function checkAdminLogin() {
  const { response, body } = await requestJson(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  assertCondition(response.ok, `Login failed (${response.status}). URL: ${API_BASE_URL}/auth/login`);
  assertCondition(body && typeof body === "object", "Expected JSON body in login response.");

  const token =
    body.token ??
    body.accessToken ??
    body.jwt ??
    (typeof body.data === "object" && body.data ? body.data.token : undefined);

  assertCondition(typeof token === "string" && token.length > 20, "Expected a valid JWT token in login response.");
}

async function main() {
  console.log(`Running API smoke checks against: ${API_BASE_URL}`);
  await checkHealth();
  console.log("OK health check");
  await checkAdminLogin();
  console.log("OK admin login");
  console.log("API smoke checks passed.");
}

main().catch((error) => {
  console.error("API smoke checks failed.");
  const details = error?.cause?.message ? `${error.message} (${error.cause.message})` : error.message;
  console.error(details);
  console.error("Tip: verify API and database are up (e.g., `docker compose up -d --build`).");
  process.exitCode = 1;
});
