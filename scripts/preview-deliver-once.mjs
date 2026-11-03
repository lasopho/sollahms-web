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
  const response = await fetchImpl(url.href, {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Development outbox scheduler unavailable");
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
