import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { deliverPreviewOnce } from "../scripts/preview-deliver-once.mjs";
test("isolated scheduler authenticates one bounded POST without declaring CRM delivery", async () => {
  const token = randomBytes(32).toString("hex"),
    environment = {
      NODE_ENV: "development",
      EMAIL_MODE: "simulation",
      CRM_PREVIEW_MODE: "isolated",
      CRM_WORKER_TOKEN: token,
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
      return new Response("not a delivery receipt", { status: 200 });
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
    CRM_WORKER_URL: "https://sollahms-preview.example.invalid/api/crm-deliver",
  };
  for (const mutation of [
    { NODE_ENV: "production" },
    { EMAIL_MODE: "live" },
    { CRM_PREVIEW_MODE: "" },
    { CRM_WORKER_TOKEN: "" },
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
