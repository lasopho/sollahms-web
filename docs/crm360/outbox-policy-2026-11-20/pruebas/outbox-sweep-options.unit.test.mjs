// ONE new JavaScript constructor-validation contract. No SQL is executed or
// emulated; this test cannot accept PostgreSQL behavior or the sweep query.
import test from "node:test";
import assert from "node:assert/strict";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

const sourceRoot = process.env.OUTBOX_SOURCE_ROOT;
if (typeof sourceRoot !== "string" || !isAbsolute(sourceRoot))
  throw new Error("Explicit absolute candidate source root required");
const { createPostgresOutbox } = await import(
  pathToFileURL(join(sourceRoot, "lib/crm-outbox-postgres.mjs")).href
);

await test(
  "sweepBatchSize accepts only integer bounds 1..100 or the omitted default and never queries during construction",
  { timeout: 3000, concurrency: false },
  () => {
    let queries = 0;
    const pool = {
      query() {
        queries++;
        throw new Error("Unexpected SQL in constructor-validation contract");
      },
    };

    for (const sweepBatchSize of [0, -1, 101, 1.2, NaN, Infinity, "32", null]) {
      assert.throws(
        () => createPostgresOutbox({ pool, sweepBatchSize }),
        `Invalid sweepBatchSize: ${String(sweepBatchSize)}`,
      );
      // An exception raised by query() must not count as validation success.
      assert.equal(queries, 0);
    }

    for (const sweepBatchSize of [1, 32, 100]) {
      assert.doesNotThrow(() => createPostgresOutbox({ pool, sweepBatchSize }));
      assert.equal(queries, 0);
    }
    assert.doesNotThrow(() => createPostgresOutbox({ pool }));
    assert.equal(queries, 0);
  },
);
