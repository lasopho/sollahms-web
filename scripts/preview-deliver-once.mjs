import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
// Explicit supervised development scheduler. Uses the existing authenticated
// POST handler; no provider keys, direct DB, new delivery logic or hidden cron.
export async function deliverPreviewOnce({
  environment = process.env,
  fetchImpl = fetch,
} = {}) {
  if (
    environment.NODE_ENV !== "development" ||
    environment.EMAIL_MODE !== "simulation" ||
    environment.CRM_PREVIEW_MODE !== "isolated"
  )
    throw new Error("Isolated development scheduler required");
  const token = environment.CRM_WORKER_TOKEN;
  if (typeof token !== "string" || !/^[\x21-\x7e]{32,512}$/.test(token))
    throw new Error("Dedicated scheduler token required");
  const url = new URL(environment.CRM_WORKER_URL);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/api/crm-deliver" ||
    ["sollahms.cl", "www.sollahms.cl"].includes(url.hostname)
  )
    throw new Error("Exact development HTTPS worker endpoint required");
  const expectedOrigin = new URL(environment.SOLLAHMS_PREVIEW_ORIGIN);
  if (
    expectedOrigin.origin !== environment.SOLLAHMS_PREVIEW_ORIGIN ||
    expectedOrigin.protocol !== "https:" ||
    expectedOrigin.username ||
    expectedOrigin.password ||
    expectedOrigin.origin !== url.origin
  )
    throw new Error("Reviewed isolated Sollahms origin required");
  const response = await fetchImpl(url.href, {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (
    response.status !== 200 ||
    response.redirected ||
    (response.url && response.url !== url.href)
  )
    throw new Error("Development outbox scheduler unavailable");
  // A Vercel SSO/login page can be HTML with HTTP 200. Never treat that as
  // authenticated scheduler acceptance or follow a redirect to authenticate.
  if (
    response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new Error("Expected authenticated outbox JSON response");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Outbox JSON response required");
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 2048) {
        await reader.cancel();
        throw new Error("Outbox response exceeds limit");
      }
      chunks.push(Buffer.from(chunk.value));
    }
  } finally {
    reader.releaseLock();
  }
  let result;
  try {
    result = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid outbox JSON response");
  }
  if (
    !result ||
    Array.isArray(result) ||
    typeof result !== "object" ||
    !["idle", "recorded", "pending", "failed"].includes(result.state) ||
    Object.keys(result).some((k) => !["state", "requestId"].includes(k)) ||
    (result.state === "idle"
      ? Object.hasOwn(result, "requestId")
      : typeof result.requestId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          result.requestId,
        ))
  )
    throw new Error("Unrecognized outbox receipt contract");
  if (result.state === "failed")
    throw new Error("Outbox requires authorized failure review");
  // Do not print response bodies, requests, contact data, IDs or credentials.
  return { accepted: true, deliveryConfirmed: false };
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    await deliverPreviewOnce();
    console.log(
      "Development scheduler request accepted; inspect durable outbox receipts for delivery.",
    );
  } catch {
    console.error("preview_outbox_scheduler_failed");
    process.exitCode = 1;
  }
}
