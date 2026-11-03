import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { deliverPreviewOnce } from "../scripts/preview-deliver-once.mjs";
test("isolated scheduler authenticates one bounded POST without declaring CRM delivery", async () => {
  const token = randomBytes(32).toString("hex"),
    environment = {
      NODE_ENV: "development",
      EMAIL_MODE: "simulation",
      CRM_PREVIEW_MODE: "isolated",
      CRM_WORKER_TOKEN: token,
      SOLLAHMS_PREVIEW_ORIGIN: "https://sollahms-preview.example.invalid",
      CRM_WORKER_URL:
        "https://sollahms-preview.example.invalid/api/crm-deliver",
    };
  let called = 0;
  const result = await deliverPreviewOnce({
    environment,
    fetchImpl: async (url, options) => {
      called++;
      assert.equal(url, environment.CRM_WORKER_URL);
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer " + token);
      assert.equal(options.redirect, "error");
      assert.ok(options.signal);
      return Response.json({ state: "idle" });
    },
  });
  assert.equal(called, 1);
  assert.deepEqual(result, { accepted: true, deliveryConfirmed: false });
  assert.ok(!JSON.stringify(result).includes(token));
  await assert.rejects(
    deliverPreviewOnce({
      environment,
      fetchImpl: async () => new Response("", { status: 503 }),
    }),
    /unavailable/,
  );
});
test("isolated scheduler refuses production, real endpoints, insecure redirects and missing authentication before network", async () => {
  const base = {
    NODE_ENV: "development",
    EMAIL_MODE: "simulation",
    CRM_PREVIEW_MODE: "isolated",
    CRM_WORKER_TOKEN: "x".repeat(32),
    SOLLAHMS_PREVIEW_ORIGIN: "https://sollahms-preview.example.invalid",
    CRM_WORKER_URL: "https://sollahms-preview.example.invalid/api/crm-deliver",
  };
  for (const mutation of [
    { NODE_ENV: "production" },
    { EMAIL_MODE: "live" },
    { CRM_PREVIEW_MODE: "" },
    { CRM_WORKER_TOKEN: "" },
    { SOLLAHMS_PREVIEW_ORIGIN: "https://another-preview.example.invalid" },
    { SOLLAHMS_PREVIEW_ORIGIN: "" },
    { CRM_WORKER_URL: "https://sollahms.cl/api/crm-deliver" },
    { CRM_WORKER_URL: "http://preview.example.invalid/api/crm-deliver" },
    {
      CRM_WORKER_URL:
        "https://preview.example.invalid/api/crm-deliver?secret=synthetic",
    },
  ]) {
    let called = false;
    await assert.rejects(
      deliverPreviewOnce({
        environment: { ...base, ...mutation },
        fetchImpl: async () => {
          called = true;
          throw new Error("Network forbidden");
        },
      }),
    );
    assert.equal(called, false);
  }
});

const schedulerEnvironment = () => ({
  NODE_ENV: "development",
  EMAIL_MODE: "simulation",
  CRM_PREVIEW_MODE: "isolated",
  CRM_WORKER_TOKEN: randomBytes(32).toString("hex"),
  SOLLAHMS_PREVIEW_ORIGIN: "https://sollahms-preview.example.invalid",
  CRM_WORKER_URL: "https://sollahms-preview.example.invalid/api/crm-deliver",
});
test("isolated scheduler rejects SSO login HTML, redirects, invalid JSON and oversized or unknown receipts", async () => {
  const responses = [
    () =>
      new Response("<html>Sign in with SSO</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    () =>
      new Response(null, {
        status: 302,
        headers: { location: "https://login.example.invalid" },
      }),
    () =>
      new Response("{broken", {
        headers: { "content-type": "application/json" },
      }),
    () => Response.json({ state: "idle", padding: "x".repeat(3000) }),
    () => Response.json({ ok: true }),
    () => Response.json({ state: "recorded", requestId: "not-a-uuid" }),
  ];
  for (const response of responses)
    await assert.rejects(
      deliverPreviewOnce({
        environment: schedulerEnvironment(),
        fetchImpl: async () => response(),
      }),
    );
});
test("isolated scheduler reports exhausted outbox failure without logging payload and keeps pending distinct from delivery", async () => {
  const requestId = randomUUID(),
    environment = schedulerEnvironment();
  for (const state of ["pending", "recorded"]) {
    const result = await deliverPreviewOnce({
      environment,
      fetchImpl: async () => Response.json({ state, requestId }),
    });
    assert.equal(result.accepted, true);
    assert.equal(result.deliveryConfirmed, false);
    assert.ok(!JSON.stringify(result).includes(requestId));
  }
  await assert.rejects(
    deliverPreviewOnce({
      environment,
      fetchImpl: async () => Response.json({ state: "failed", requestId }),
    }),
    /authorized failure review/,
  );
});
test("isolated scheduler never sends its application token to an origin outside the reviewed deployment", async () => {
  let calls = 0;
  const environment = schedulerEnvironment();
  environment.CRM_WORKER_URL =
    "https://unreviewed.example.invalid/api/crm-deliver";
  await assert.rejects(
    deliverPreviewOnce({
      environment,
      fetchImpl: async () => {
        calls++;
        return Response.json({ state: "idle" });
      },
    }),
    /origin/,
  );
  assert.equal(calls, 0);
});
