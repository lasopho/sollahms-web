// PREPARED, NOT EXECUTED. Requires an independently authorized EXISTING local lab.
// No database/schema/role/service provisioning, hosted connection or HTTP transport.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { lstat, realpath, readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { randomBytes, randomUUID } from "node:crypto";

const FAILURE = "Outbox PostgreSQL laboratory preflight rejected";
const OPERATION_FAILURE = "Outbox PostgreSQL laboratory operation rejected";
const TABLE = "sollahms_private.crm_outbox";
const SWEEP_PREFIX = "WITH exhausted AS MATERIALIZED (";
const DELIVERY_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ACK =
  "existing-exclusive-synthetic-outbox-lab-writes-and-object-recreation-only";
const SCHEMA_ACK =
  "existing-source-ddl-vetted-no-triggers-rules-or-foreign-keys";
const REF = /^[A-Za-z][A-Za-z0-9_-]{2,79}$/;
const DATABASE = /^crm360_test_sender_[a-z0-9_]{1,40}$/;
const ROLE = /^[a-z_][a-z0-9_]{0,62}$/;
const OWNED = new Set();
const POOLS = new Set();
let poolFault = false;

function requireCondition(value, message = FAILURE) {
  if (!value) throw new Error(message);
}

function required(name) {
  const value = process.env[name];
  requireCondition(typeof value === "string" && value.length > 0);
  return value;
}

function canonicalAbsolute(value) {
  requireCondition(
    isAbsolute(value) &&
      resolve(value) === value &&
      !/[\x00-\x1f\x7f\\]/.test(value),
  );
  return value;
}

async function existingPath(path, kind) {
  const metadata = await lstat(path);
  requireCondition(
    !metadata.isSymbolicLink() && (await realpath(path)) === path,
  );
  requireCondition(
    kind === "directory" ? metadata.isDirectory() : metadata.isFile(),
  );
  requireCondition([0, process.getuid?.()].includes(metadata.uid));
  requireCondition((metadata.mode & 0o022) === 0);
  if (kind === "file") requireCondition(metadata.nlink === 1);
}

// Runs before importing the driver/modules or opening any SQL connection.
async function admitInputs() {
  requireCondition(required("CRM360_OUTBOX_PG_AUTHORIZATION_ACK") === ACK);
  requireCondition(required("CRM360_OUTBOX_PG_SCHEMA_ACK") === SCHEMA_ACK);
  for (const name of [
    "CRM360_OUTBOX_PG_LAB_REFERENCE",
    "CRM360_OUTBOX_PG_AUTHORIZATION_REFERENCE",
  ])
    requireCondition(REF.test(required(name)));
  requireCondition(
    required("CRM360_OUTBOX_PG_EXCLUSIVE_WINDOW_ACK") ===
      "sole-lab-database-table-no-other-writers",
  );
  // No credential/default discovery or externally supplied Node loader hooks.
  for (const name of Object.keys(process.env)) {
    if (
      name.startsWith("PG") ||
      /^NODE_PG_/.test(name) ||
      /^(DATABASE_URL|NODE_OPTIONS|NODE_PATH|NODE_EXTRA_CA_CERTS|NODE_TLS_REJECT_UNAUTHORIZED|LD_PRELOAD|LD_LIBRARY_PATH|DYLD_.*)$/.test(
        name,
      )
    )
      requireCondition(false);
  }
  const node = process.versions.node.split(".").map(Number);
  requireCondition(node[0] === 24 && node[1] >= 10);
  const database = required("CRM360_OUTBOX_PG_DATABASE");
  const user = required("CRM360_OUTBOX_PG_EXPECTED_ROLE");
  requireCondition(DATABASE.test(database) && ROLE.test(user));
  const portText = required("CRM360_OUTBOX_PG_PORT");
  requireCondition(/^[1-9][0-9]{0,4}$/.test(portText));
  const port = Number(portText);
  requireCondition(port <= 65535);
  const host = canonicalAbsolute(required("CRM360_OUTBOX_PG_SOCKET_DIRECTORY"));
  await existingPath(host, "directory");
  const socket = await lstat(join(host, `.s.PGSQL.${port}`));
  requireCondition(socket.isSocket() && !socket.isSymbolicLink());
  const paths = {
    original: canonicalAbsolute(required("CRM360_OUTBOX_ORIGINAL_MODULE_PATH")),
    candidate: canonicalAbsolute(
      required("CRM360_OUTBOX_CANDIDATE_MODULE_PATH"),
    ),
    delivery: canonicalAbsolute(required("CRM360_OUTBOX_DELIVERY_MODULE_PATH")),
    driver: canonicalAbsolute(required("CRM360_OUTBOX_PG_DRIVER_DIRECTORY")),
  };
  requireCondition(
    paths.original === join(DELIVERY_ROOT, "base/lib/crm-outbox-postgres.mjs"),
  );
  requireCondition(
    paths.candidate ===
      join(DELIVERY_ROOT, "candidato/lib/crm-outbox-postgres.mjs"),
  );
  requireCondition(
    paths.delivery === join(DELIVERY_ROOT, "base/lib/crm-delivery.mjs"),
  );
  for (const path of [paths.original, paths.candidate, paths.delivery]) {
    await existingPath(dirname(path), "directory");
    await existingPath(path, "file");
  }
  await existingPath(paths.driver, "directory");
  await existingPath(join(paths.driver, "package.json"), "file");
  const metadata = JSON.parse(
    await readFile(join(paths.driver, "package.json"), "utf8"),
  );
  requireCondition(metadata.name === "pg" && metadata.version === "8.16.3");
  const requireDriver = createRequire(
    pathToFileURL(join(paths.driver, "package.json")),
  );
  const pg = requireDriver(paths.driver);
  requireCondition(typeof pg.Pool === "function");
  const [original, candidate, delivery] = await Promise.all([
    import(pathToFileURL(paths.original)),
    import(pathToFileURL(paths.candidate)),
    import(pathToFileURL(paths.delivery)),
  ]);
  requireCondition(
    typeof original.createPostgresOutbox === "function" &&
      typeof candidate.createPostgresOutbox === "function",
  );
  requireCondition(
    typeof delivery.createCrmDelivery === "function" &&
      typeof delivery.createDeliveryWorker === "function",
  );
  return {
    Pool: pg.Pool,
    database,
    user,
    host,
    port,
    original,
    candidate,
    delivery,
  };
}

async function query(client, sql, parameters = []) {
  try {
    return await client.query(sql, parameters);
  } catch {
    throw new Error(OPERATION_FAILURE);
  }
}

function newPool(settings, max = 4) {
  const pool = new settings.Pool({
    host: settings.host,
    port: settings.port,
    database: settings.database,
    user: settings.user,
    // Unix peer/trust authentication must already be admitted. No password file,
    // credential environment, SSL fallback or hosted transport is discovered.
    password: async () => undefined,
    ssl: false,
    max,
    options: "-c search_path=pg_catalog",
    connectionTimeoutMillis: 3000,
    query_timeout: 5000,
    statement_timeout: 3000,
    idle_in_transaction_session_timeout: 10000,
    application_name: "crm360-test-sender-outbox-policy",
  });
  pool.on("error", () => {
    poolFault = true;
  });
  POOLS.add(pool);
  return pool;
}

const EXPECTED_COLUMNS = [
  ["id", "uuid", true, null],
  ["fingerprint", "text", true, null],
  ["payload", "jsonb", true, null],
  ["state", "text", true, "'pending'::text"],
  ["attempts", "integer", true, "0"],
  ["available_at", "timestamp with time zone", true, "clock_timestamp()"],
  ["lease", "uuid", false, null],
  ["lease_until", "timestamp with time zone", false, null],
  ["created_at", "timestamp with time zone", true, "clock_timestamp()"],
  ["recorded_at", "timestamp with time zone", false, null],
  ["receipt", "jsonb", false, null],
  ["error_code", "text", false, null],
];

async function admitDatabase(settings, control) {
  const identity = (
    await query(
      control,
      `SELECT current_database() AS database,
    current_user::text AS role,session_user::text AS session_role,
    current_setting('server_version_num')::integer AS version,
    current_setting('transaction_isolation') AS isolation`,
    )
  ).rows[0];
  requireCondition(
    identity?.database === settings.database &&
      identity.role === settings.user &&
      identity.session_role === settings.user,
  );
  // This prepared catalogue contract is fixed to PostgreSQL 17.x.
  // Other major versions need a separately reviewed catalogue guard.
  requireCondition(
    identity.version >= 170000 &&
      identity.version < 180000 &&
      identity.isolation === "read committed",
  );
  const object = (
    await query(
      control,
      `SELECT c.relkind,c.relpersistence,c.relrowsecurity,c.relforcerowsecurity,
    (c.relowner=r.oid) AS owned,r.rolsuper,r.rolbypassrls,
    has_schema_privilege(current_user,'sollahms_private','USAGE') AS usage,
    has_table_privilege(current_user,'sollahms_private.crm_outbox','SELECT') AS read,
    has_table_privilege(current_user,'sollahms_private.crm_outbox','INSERT') AS can_insert,
    has_table_privilege(current_user,'sollahms_private.crm_outbox','UPDATE') AS can_update,
    has_table_privilege(current_user,'sollahms_private.crm_outbox','DELETE') AS can_delete
    FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_catalog.pg_roles r ON r.rolname=current_user
    WHERE n.nspname='sollahms_private' AND c.relname='crm_outbox'`,
    )
  ).rows;
  requireCondition(object.length === 1);
  const table = object[0];
  requireCondition(
    table.relkind === "r" &&
      table.relpersistence === "p" &&
      table.relrowsecurity === true &&
      table.relforcerowsecurity === false,
  );
  requireCondition(table.owned || table.rolsuper || table.rolbypassrls);
  requireCondition(
    ["usage", "read", "can_insert", "can_update", "can_delete"].every(
      (key) => table[key] === true,
    ),
  );
  const columns = (
    await query(
      control,
      `SELECT a.attname AS name,pg_catalog.format_type(a.atttypid,a.atttypmod) AS type,
    a.attnotnull AS not_null,a.attgenerated AS generated,a.attidentity AS identity,
    pg_catalog.pg_get_expr(d.adbin,d.adrelid) AS default_expr
    FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE a.attrelid='sollahms_private.crm_outbox'::regclass AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum`,
    )
  ).rows;
  requireCondition(columns.length === EXPECTED_COLUMNS.length);
  columns.forEach((column, index) => {
    const [name, type, notNull, defaultExpression] = EXPECTED_COLUMNS[index];
    requireCondition(
      column.name === name &&
        column.type === type &&
        column.not_null === notNull &&
        column.default_expr === defaultExpression,
    );
    requireCondition(column.generated === "" && column.identity === "");
  });
  const shape = (
    await query(
      control,
      `SELECT
    (SELECT count(*)::integer FROM pg_catalog.pg_trigger WHERE tgrelid='sollahms_private.crm_outbox'::regclass) AS triggers,
    (SELECT count(*)::integer FROM pg_catalog.pg_rewrite WHERE ev_class='sollahms_private.crm_outbox'::regclass) AS rules,
    (SELECT count(*)::integer FROM pg_catalog.pg_constraint WHERE (conrelid='sollahms_private.crm_outbox'::regclass OR confrelid='sollahms_private.crm_outbox'::regclass) AND contype='f') AS foreign_keys,
    (SELECT count(*)::integer FROM pg_catalog.pg_constraint WHERE conrelid='sollahms_private.crm_outbox'::regclass) AS constraints,
    (SELECT count(*)::integer FROM pg_catalog.pg_constraint WHERE conrelid='sollahms_private.crm_outbox'::regclass AND contype='c') AS checks,
    (SELECT count(*)::integer FROM pg_catalog.pg_constraint WHERE conrelid='sollahms_private.crm_outbox'::regclass AND NOT convalidated) AS unvalidated,
    (SELECT count(*)::integer FROM pg_catalog.pg_constraint k JOIN pg_catalog.pg_attribute a ON a.attrelid=k.conrelid AND a.attnum=k.conkey[1]
      WHERE k.conrelid='sollahms_private.crm_outbox'::regclass AND k.contype='p' AND cardinality(k.conkey)=1 AND a.attname='id') AS primary_keys`,
    )
  ).rows[0];
  requireCondition(
    shape.triggers === 0 &&
      shape.rules === 0 &&
      shape.foreign_keys === 0 &&
      shape.constraints === 7 &&
      shape.checks === 6 &&
      shape.unvalidated === 0 &&
      shape.primary_keys === 1,
  );
  const lock = (
    await query(
      control,
      "SELECT pg_try_advisory_lock(1129467190,1330992194) AS acquired",
    )
  ).rows[0];
  requireCondition(lock?.acquired === true);
  // The advisory lock coordinates THIS harness only. Human-exclusive use of the
  // dedicated database/table is required; it cannot fence an unrelated writer.
  requireCondition(
    (await query(control, `SELECT count(*)::integer AS count FROM ${TABLE}`))
      .rows[0].count === 0,
  );
}

let settings, pool, control;
try {
  settings = await admitInputs();
  pool = newPool(settings);
  control = await pool.connect();
  await admitDatabase(settings, control);
} catch {
  if (control) control.release(true);
  await Promise.allSettled([...POOLS].map((item) => item.end()));
  throw new Error(FAILURE); // Missing admission is a failure, never a green skip.
}

function own(id) {
  requireCondition(
    typeof id === "string" && OWNED.has(id),
    "Outbox laboratory cohort isolation rejected",
  );
}

async function empty() {
  requireCondition(
    (await query(control, `SELECT count(*)::integer AS count FROM ${TABLE}`))
      .rows[0].count === 0,
    "Exclusive empty laboratory table required",
  );
}

async function clean(ids) {
  if (!ids.length) return;
  ids.forEach(own);
  await query(control, "BEGIN ISOLATION LEVEL READ COMMITTED");
  try {
    await query(control, `DELETE FROM ${TABLE} WHERE id=ANY($1::uuid[])`, [
      ids,
    ]);
    await query(control, "COMMIT");
  } catch {
    await query(control, "ROLLBACK").catch(() => {});
    throw new Error("Owned synthetic fixture cleanup unconfirmed");
  }
}

after(async () => {
  try {
    await clean([...OWNED]);
    await empty();
    await query(control, "SELECT pg_advisory_unlock(1129467190,1330992194)");
    requireCondition(!poolFault, OPERATION_FAILURE);
  } finally {
    control.release(true);
    const ended = await Promise.allSettled(
      [...POOLS].map((item) => item.end()),
    );
    requireCondition(
      ended.every((item) => item.status === "fulfilled"),
      "Owned synthetic fixture resources cleanup unconfirmed",
    );
  }
});

function store(module, target = pool, maxAttempts = 5, options = {}) {
  requireCondition(
    options &&
      typeof options === "object" &&
      !Array.isArray(options) &&
      Object.keys(options).every((name) => name === "sweepBatchSize"),
    OPERATION_FAILURE,
  );
  const implementation = module.createPostgresOutbox({
    pool: target,
    maxAttempts,
    leaseSeconds: 300,
    retrySeconds: 1,
    ...(Object.hasOwn(options, "sweepBatchSize")
      ? { sweepBatchSize: options.sweepBatchSize }
      : {}),
  });
  const result = {};
  for (const method of ["put", "claim", "complete", "retry", "status"]) {
    requireCondition(typeof implementation[method] === "function");
    result[method] = async (...args) => {
      try {
        return await implementation[method](...args);
      } catch {
        throw new Error(OPERATION_FAILURE);
      }
    };
  }
  return result;
}

function context() {
  const ids = [],
    leases = [],
    privatePools = new Set();
  const ctx = {
    ids,
    event() {
      const id = randomUUID();
      OWNED.add(id);
      ids.push(id);
      return {
        version: 1,
        requestId: id,
        occurredAt: "2026-11-17T12:00:00.000Z",
        source: "sollahms_web",
        type: "general",
        person: {
          name: "Consulta sintética de política",
          email: "fixture@example.invalid",
        },
        message: "Fixture sintética local sin contacto comercial",
        attribution: { form: "synthetic-policy" },
        consent: { respond: true, marketing: false },
      };
    },
    pool() {
      const item = newPool(settings, 2);
      privatePools.add(item);
      return item;
    },
    async closePool(item) {
      requireCondition(privatePools.has(item), OPERATION_FAILURE);
      await item.end();
      privatePools.delete(item);
      POOLS.delete(item);
    },
    async lease(target = pool) {
      let client;
      try {
        client = await target.connect();
      } catch {
        throw new Error(OPERATION_FAILURE);
      }
      const item = { client, transaction: false, released: false };
      leases.push(item);
      return item;
    },
    async begin(item) {
      await query(item.client, "BEGIN ISOLATION LEVEL READ COMMITTED");
      item.transaction = true;
      requireCondition(
        (
          await query(
            item.client,
            "SELECT current_setting('transaction_isolation') AS isolation",
          )
        ).rows[0].isolation === "read committed",
      );
    },
    async commit(item) {
      await query(item.client, "COMMIT");
      item.transaction = false;
    },
    async release(item) {
      if (item.released) return;
      try {
        if (item.transaction) await query(item.client, "ROLLBACK");
      } finally {
        item.transaction = false;
        item.client.release(true);
        item.released = true;
      }
    },
    async close() {
      const released = await Promise.allSettled(
        leases.map((item) => ctx.release(item)),
      );
      const closed = await Promise.allSettled(
        [...privatePools].map((item) => ctx.closePool(item)),
      );
      try {
        await clean(ids);
        await empty();
      } finally {
        requireCondition(
          released.every((item) => item.status === "fulfilled") &&
            closed.every((item) => item.status === "fulfilled"),
          "Owned synthetic fixture resources cleanup unconfirmed",
        );
      }
    },
  };
  return ctx;
}

function scenario(name, body) {
  test(name, { concurrency: false, timeout: 30000 }, async () => {
    requireCondition(!poolFault, OPERATION_FAILURE);
    await empty();
    const ctx = context();
    try {
      await body(ctx);
      requireCondition(!poolFault, OPERATION_FAILURE);
    } finally {
      await ctx.close();
    }
  });
}

async function row(id) {
  own(id);
  const result = await query(
    pool,
    `SELECT id,fingerprint,payload,state,attempts,available_at::text AS available_at,
    lease,lease_until::text AS lease_until,created_at::text AS created_at,recorded_at::text AS recorded_at,receipt,error_code FROM ${TABLE} WHERE id=$1`,
    [id],
  );
  requireCondition(result.rows.length === 1, OPERATION_FAILURE);
  return result.rows[0];
}

async function due(id) {
  own(id);
  assert.equal(
    (
      await query(
        pool,
        `UPDATE ${TABLE} SET available_at=clock_timestamp()-interval '1 second' WHERE id=$1 AND state='pending'`,
        [id],
      )
    ).rowCount,
    1,
  );
}

async function attempts(ctx, count, { keepLease = false, target = pool } = {}) {
  const event = ctx.event(),
    old = store(settings.original, target, 12);
  await old.put(event.requestId, event);
  let item;
  for (let index = 1; index <= count; index++) {
    await due(event.requestId);
    item = await old.claim();
    own(item?.id);
    assert.equal(item.id, event.requestId);
    assert.equal(item.attempts, index);
    if (!(keepLease && index === count))
      assert.equal(await old.retry(item.id, item.lease), true);
  }
  return { event, item, old };
}

function unchangedHistory(before, after) {
  for (const key of [
    "id",
    "fingerprint",
    "payload",
    "attempts",
    "available_at",
    "created_at",
    "receipt",
    "recorded_at",
  ])
    assert.deepEqual(after[key], before[key], key);
}

function failedWithoutReset(before, result) {
  unchangedHistory(before, result);
  assert.equal(result.state, "failed");
  assert.equal(result.error_code, "delivery_exhausted");
  assert.equal(result.lease, null);
  assert.equal(result.lease_until, null);
}

// Keep older fixtures unavailable to the ORIGINAL max12 helper while constructing
// the next one. The candidate must sweep them regardless of this future date.
async function exhaustedPendingCohort(ctx, count) {
  const fixtures = [];
  for (let index = 0; index < count; index++) {
    const { event } = await attempts(ctx, 8);
    assert.equal(
      (
        await query(
          pool,
          `UPDATE ${TABLE} SET created_at='2025-01-01T00:00:00Z'::timestamptz,available_at=clock_timestamp()+interval '1 day' WHERE id=$1 AND state='pending'`,
          [event.requestId],
        )
      ).rowCount,
      1,
    );
    fixtures.push({ event, before: await row(event.requestId) });
  }
  // PostgreSQL's uuid ordering matches canonical lowercase UUID byte ordering.
  return fixtures.sort((left, right) =>
    left.event.requestId < right.event.requestId ? -1 : 1,
  );
}

scenario(
  "01 Original pending after eight real attempts under max12 gets stuck under max5; candidate finalizes without resetting history",
  async (ctx) => {
    const { event } = await attempts(ctx, 8);
    const before = await row(event.requestId);
    assert.equal(before.state, "pending");
    assert.equal(before.attempts, 8);
    assert.equal(await store(settings.original, pool, 5).claim(), null);
    assert.deepEqual(await row(event.requestId), before);
    assert.equal(await store(settings.candidate).claim(), null);
    failedWithoutReset(before, await row(event.requestId));
  },
);

scenario(
  "02 Exhausting the original max12 already produces terminal failed; later lower or higher budgets cannot resurrect it",
  async (ctx) => {
    const { event } = await attempts(ctx, 12);
    const before = await row(event.requestId);
    assert.equal(before.state, "failed");
    assert.equal(before.attempts, 12);
    for (const max of [5, 20]) {
      assert.equal(await store(settings.candidate, pool, max).claim(), null);
      assert.deepEqual(await row(event.requestId), before);
    }
  },
);

scenario(
  "03 An old exhausted pending row with future available_at is finalized immediately with age availability and history unchanged",
  async (ctx) => {
    const { event } = await attempts(ctx, 8);
    await query(
      pool,
      `UPDATE ${TABLE} SET created_at='2025-01-01T00:00:00Z'::timestamptz,available_at=clock_timestamp()+interval '1 day' WHERE id=$1`,
      [event.requestId],
    );
    const before = await row(event.requestId);
    assert.equal(
      new Date(before.created_at).toISOString(),
      "2025-01-01T00:00:00.000Z",
    );
    assert.equal(await store(settings.candidate).claim(), null);
    failedWithoutReset(before, await row(event.requestId));
  },
);

scenario(
  "04 Concurrent claims through independent real pools yield one owner and one attempt increment",
  async (ctx) => {
    const event = ctx.event();
    await store(settings.candidate).put(event.requestId, event);
    const stores = [ctx.pool(), ctx.pool(), ctx.pool()].map((item) =>
      store(settings.candidate, item),
    );
    const results = await Promise.allSettled(
      stores.map((item) => item.claim()),
    );
    requireCondition(
      results.every((item) => item.status === "fulfilled"),
      OPERATION_FAILURE,
    );
    const claims = results.map((item) => item.value);
    const winners = claims.filter(Boolean);
    assert.equal(winners.length, 1);
    own(winners[0].id);
    assert.equal(winners[0].id, event.requestId);
    assert.equal((await row(event.requestId)).attempts, 1);
    assert.equal(
      await stores[0].complete(event.requestId, winners[0].lease, {
        requestId: event.requestId,
        state: "recorded",
      }),
      true,
    );
  },
);

scenario(
  "05 Lower policy leaves an active exhausted lease intact and its valid original acknowledgement can still commit",
  async (ctx) => {
    const { event, item, old } = await attempts(ctx, 8, { keepLease: true });
    const before = await row(event.requestId);
    assert.equal(await store(settings.candidate).claim(), null);
    assert.deepEqual(await row(event.requestId), before);
    assert.equal(
      await old.complete(event.requestId, item.lease, {
        requestId: event.requestId,
        state: "recorded",
        review: true,
      }),
      true,
    );
    const recorded = await row(event.requestId);
    assert.equal(recorded.state, "recorded");
    assert.equal(recorded.attempts, 8);
    assert.deepEqual(recorded.receipt, {
      requestId: event.requestId,
      state: "recorded",
    });
  },
);

scenario(
  "06 An expired exhausted lease is finalized without losing payload fingerprint attempts or recorded history",
  async (ctx) => {
    const { event } = await attempts(ctx, 8, { keepLease: true });
    await query(
      pool,
      `UPDATE ${TABLE} SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1`,
      [event.requestId],
    );
    const before = await row(event.requestId);
    assert.equal(await store(settings.candidate).claim(), null);
    failedWithoutReset(before, await row(event.requestId));
  },
);

scenario(
  "07 Below-budget pending work respects availability and increments once; terminal recorded review metadata is not rewritten",
  async (ctx) => {
    const event = ctx.event(),
      candidate = store(settings.candidate);
    await candidate.put(event.requestId, event);
    await query(
      pool,
      `UPDATE ${TABLE} SET available_at=clock_timestamp()+interval '1 day' WHERE id=$1`,
      [event.requestId],
    );
    const future = await row(event.requestId);
    assert.equal(await candidate.claim(), null);
    assert.deepEqual(await row(event.requestId), future);
    await due(event.requestId);
    const claimed = await candidate.claim();
    own(claimed?.id);
    assert.equal(claimed.attempts, 1);
    assert.equal(
      await candidate.complete(event.requestId, claimed.lease, {
        requestId: event.requestId,
        state: "recorded",
      }),
      true,
    );
    // Deliberate fixture metadata, not a new business format or complete() behavior.
    await query(pool, `UPDATE ${TABLE} SET receipt=$2::jsonb WHERE id=$1`, [
      event.requestId,
      JSON.stringify({
        requestId: event.requestId,
        state: "recorded",
        review: true,
      }),
    ]);
    const terminal = await row(event.requestId);
    for (const max of [1, 20]) {
      assert.equal(await store(settings.candidate, pool, max).claim(), null);
      assert.deepEqual(await row(event.requestId), terminal);
    }

    const recovered = await attempts(ctx, 3, { keepLease: true });
    await query(
      pool,
      `UPDATE ${TABLE} SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1`,
      [recovered.event.requestId],
    );
    const expired = await row(recovered.event.requestId);
    const newClaim = await candidate.claim();
    own(newClaim?.id);
    assert.equal(newClaim.id, recovered.event.requestId);
    assert.equal(newClaim.attempts, 4);
    assert.notEqual(newClaim.lease, recovered.item.lease);
    assert.equal(
      await recovered.old.complete(
        recovered.event.requestId,
        recovered.item.lease,
        { requestId: recovered.event.requestId, state: "recorded" },
      ),
      false,
    );
    assert.equal(
      await recovered.old.retry(
        recovered.event.requestId,
        recovered.item.lease,
      ),
      false,
    );
    const reclaimed = await row(recovered.event.requestId);
    for (const field of [
      "id",
      "fingerprint",
      "payload",
      "available_at",
      "created_at",
    ])
      assert.deepEqual(reclaimed[field], expired[field], field);
    assert.equal(
      await candidate.complete(recovered.event.requestId, newClaim.lease, {
        requestId: recovered.event.requestId,
        state: "recorded",
      }),
      true,
    );
    const recoveredTerminal = await row(recovered.event.requestId);
    assert.deepEqual(
      await candidate.put(recovered.event.requestId, recovered.event),
      { durable: true, id: recovered.event.requestId, state: "recorded" },
    );
    assert.deepEqual(await row(recovered.event.requestId), recoveredTerminal);
  },
);

scenario(
  "08 Recreating only the worker object and SQL connection observes committed exhausted state without restarting PostgreSQL",
  async (ctx) => {
    const firstPool = ctx.pool();
    const { event } = await attempts(ctx, 8, { target: firstPool });
    const oldPid = (await query(firstPool, "SELECT pg_backend_pid() AS pid"))
      .rows[0].pid;
    const key = randomBytes(32);
    let worker;
    try {
      const oldDelivery = settings.delivery.createCrmDelivery({
        store: store(settings.original, firstPool, 12),
        key,
        transport: async () => {
          throw new Error("Transport must remain unused");
        },
      });
      worker = settings.delivery.createDeliveryWorker({
        delivery: oldDelivery,
      });
      await worker.close();
      await ctx.closePool(firstPool);
      const secondPool = ctx.pool();
      const newPid = (await query(secondPool, "SELECT pg_backend_pid() AS pid"))
        .rows[0].pid;
      assert.notEqual(newPid, oldPid);
      let calls = 0;
      const newDelivery = settings.delivery.createCrmDelivery({
        store: store(settings.candidate, secondPool),
        key,
        transport: async () => {
          calls++;
          throw new Error("Transport must remain unused");
        },
      });
      worker = settings.delivery.createDeliveryWorker({
        delivery: newDelivery,
      });
      assert.deepEqual(await worker.runOnce(), { state: "idle" });
      assert.equal(calls, 0);
      assert.equal((await row(event.requestId)).state, "failed");
    } finally {
      await worker?.close();
      key.fill(0);
    }
  },
);

scenario(
  "09 A lost remote acknowledgement retries the same identity while a DOUBLE ledger preserves review and commercial state",
  async (ctx) => {
    const event = ctx.event(),
      key = randomBytes(32),
      remoteLedger = new Map();
    let calls = 0;
    const candidate = store(settings.candidate);
    const delivery = settings.delivery.createCrmDelivery({
      store: candidate,
      key,
      transport: async ({ body }) => {
        calls++;
        const received = JSON.parse(body);
        own(received.requestId);
        assert.equal(received.requestId, event.requestId);
        if (!remoteLedger.has(received.requestId))
          remoteLedger.set(received.requestId, {
            recorded: true,
            review: true,
            qualified: false,
            booked: false,
            consentEmail: false,
          });
        if (calls === 1)
          throw new Error(
            "Synthetic lost acknowledgement after DOUBLE ledger write",
          );
        return {
          requestId: received.requestId,
          state: "recorded",
          review: true,
          duplicate: true,
        };
      },
    });
    try {
      await delivery.receive(event);
      assert.equal((await delivery.tick()).state, "pending");
      assert.equal((await row(event.requestId)).attempts, 1);
      await due(event.requestId);
      assert.equal((await delivery.tick()).state, "recorded");
      const recorded = await row(event.requestId);
      assert.equal(recorded.attempts, 2);
      assert.equal(calls, 2);
      assert.equal(remoteLedger.size, 1);
      assert.deepEqual(recorded.payload, event);
      assert.deepEqual(recorded.receipt, {
        requestId: event.requestId,
        state: "recorded",
      });
      assert.deepEqual(remoteLedger.get(event.requestId), {
        recorded: true,
        review: true,
        qualified: false,
        booked: false,
        consentEmail: false,
      });
    } finally {
      key.fill(0);
      remoteLedger.clear();
    }
  },
);

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function boundedBoundary(promise) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Query boundary not reached")),
          2000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

scenario(
  "10 Real READ COMMITTED interleavings skip an old claim lock, preserve active leases and require a next tick after an old-policy retry gap",
  async (ctx) => {
    // A: the bounded finalizer skips an uncommitted old claim without waiting.
    const first = await attempts(ctx, 8);
    await due(first.event.requestId);
    const firstBeforeClaim = await row(first.event.requestId);
    const oldLease = await ctx.lease(),
      finalizerLease = await ctx.lease();
    await ctx.begin(oldLease);
    try {
      const oldStore = store(settings.original, oldLease.client, 12);
      const oldClaim = await oldStore.claim();
      own(oldClaim?.id);
      assert.equal(oldClaim.id, first.event.requestId);
      assert.equal(oldClaim.attempts, 9);
      await ctx.begin(finalizerLease);
      await query(finalizerLease.client, "SET LOCAL statement_timeout='1500ms'");
      await query(finalizerLease.client, "SET LOCAL lock_timeout='500ms'");
      assert.equal(
        await store(settings.candidate, finalizerLease.client).claim(),
        null,
      );
      // The old transaction is still open. A blocking sweep would time out and
      // fail above; no timeout is accepted as a successful skip.
      assert.equal(oldLease.transaction, true);
      assert.deepEqual(await row(first.event.requestId), firstBeforeClaim);
      await ctx.commit(finalizerLease);
      await ctx.commit(oldLease);
      const active = await row(first.event.requestId);
      assert.equal(active.state, "leased");
      assert.equal(active.lease, oldClaim.lease);
      assert.equal(active.attempts, 9);
      assert.equal(
        await oldStore.complete(first.event.requestId, oldClaim.lease, {
          requestId: first.event.requestId,
          state: "recorded",
        }),
        true,
      );
    } finally {
      try {
        await ctx.release(oldLease);
      } finally {
        await ctx.release(finalizerLease);
      }
    }

    // B: a finalizer holds the row; an old claim must SKIP LOCKED, not rescue it.
    const second = await attempts(ctx, 8);
    await due(second.event.requestId);
    const heldFinalizer = await ctx.lease();
    await ctx.begin(heldFinalizer);
    try {
      assert.equal(
        await store(settings.candidate, heldFinalizer.client).claim(),
        null,
      );
      assert.equal(await store(settings.original, pool, 12).claim(), null);
      await ctx.commit(heldFinalizer);
    } finally {
      await ctx.release(heldFinalizer);
    }
    assert.equal((await row(second.event.requestId)).state, "failed");

    // C: the candidate has TWO statements. An old retry can publish exhausted
    // pending work between them; finalization is guaranteed only on the next tick.
    const third = await attempts(ctx, 8, { keepLease: true });
    const reached = deferred(),
      proceed = deferred();
    let stopped = false;
    const tap = {
      query: async (sql, parameters) => {
        const result = await query(pool, sql, parameters);
        if (!stopped && sql.startsWith(SWEEP_PREFIX)) {
          stopped = true;
          reached.resolve();
          await proceed.promise;
        }
        return result;
      },
    };
    const inBetween = store(settings.candidate, tap).claim();
    const inBetweenResult = inBetween.then(
      (value) => ({ value }),
      () => ({ error: true }),
    );
    let result;
    try {
      await boundedBoundary(reached.promise);
      assert.equal(
        await third.old.retry(third.event.requestId, third.item.lease),
        true,
      );
      await due(third.event.requestId);
    } finally {
      proceed.resolve();
      result = await inBetweenResult;
    }
    assert.equal(result.error, undefined);
    assert.equal(result.value, null);
    assert.equal((await row(third.event.requestId)).state, "pending");
    assert.equal(await store(settings.candidate).claim(), null);
    assert.equal((await row(third.event.requestId)).state, "failed");
  },
);

scenario(
  "11 Equality at the new budget finalizes both pending and expired leased rows without resetting counters or reopening terminals",
  async (ctx) => {
    const pending = await attempts(ctx, 8);
    const pendingBefore = await row(pending.event.requestId);
    assert.equal(pendingBefore.state, "pending");
    assert.equal(await store(settings.original, pool, 8).claim(), null);
    assert.deepEqual(await row(pending.event.requestId), pendingBefore);
    assert.equal(await store(settings.candidate, pool, 8).claim(), null);
    const pendingTerminal = await row(pending.event.requestId);
    failedWithoutReset(pendingBefore, pendingTerminal);

    const leased = await attempts(ctx, 8, { keepLease: true });
    await query(
      pool,
      `UPDATE ${TABLE} SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1`,
      [leased.event.requestId],
    );
    const leasedBefore = await row(leased.event.requestId);
    assert.equal(leasedBefore.state, "leased");
    assert.equal(leasedBefore.attempts, 8);
    assert.equal(await store(settings.candidate, pool, 8).claim(), null);
    const leasedTerminal = await row(leased.event.requestId);
    failedWithoutReset(leasedBefore, leasedTerminal);
    assert.equal(
      await leased.old.complete(leased.event.requestId, leased.item.lease, {
        requestId: leased.event.requestId,
        state: "recorded",
      }),
      false,
    );
    assert.equal(
      await leased.old.retry(leased.event.requestId, leased.item.lease),
      false,
    );
    assert.equal(await store(settings.candidate, pool, 20).claim(), null);
    assert.deepEqual(await row(pending.event.requestId), pendingTerminal);
    assert.deepEqual(await row(leased.event.requestId), leasedTerminal);
  },
);

scenario(
  "12 A held exhausted pending row does not block claiming healthy work and is finalized only after its lock is released",
  async (ctx) => {
    const exhausted = await attempts(ctx, 8);
    const exhaustedBefore = await row(exhausted.event.requestId);
    const healthy = ctx.event();
    await store(settings.candidate).put(healthy.requestId, healthy);
    const locked = await ctx.lease(),
      progressing = await ctx.lease();
    try {
      await ctx.begin(locked);
      const held = await query(
        locked.client,
        `SELECT id FROM ${TABLE} WHERE id=$1 FOR UPDATE`,
        [exhausted.event.requestId],
      );
      assert.equal(held.rows[0]?.id, exhausted.event.requestId);
      await ctx.begin(progressing);
      await query(progressing.client, "SET LOCAL statement_timeout='1500ms'");
      await query(progressing.client, "SET LOCAL lock_timeout='500ms'");
      const candidate = store(settings.candidate, progressing.client, 5, {
        sweepBatchSize: 1,
      });
      // A timeout is a failure, never accepted as evidence of a successful skip.
      const claimed = await candidate.claim();
      own(claimed?.id);
      assert.equal(claimed.id, healthy.requestId);
      assert.equal(claimed.attempts, 1);
      assert.equal(locked.transaction, true);
      await ctx.commit(progressing);
      const healthyLease = await row(healthy.requestId);
      assert.equal(healthyLease.state, "leased");
      assert.equal(healthyLease.lease, claimed.lease);
      assert.deepEqual(await row(exhausted.event.requestId), exhaustedBefore);

      // A remains locked here. Its row must still be skipped; the healthy lease
      // cannot be reclaimed by a second invocation.
      assert.equal(await candidate.claim(), null);
      assert.deepEqual(await row(healthy.requestId), healthyLease);
      assert.deepEqual(await row(exhausted.event.requestId), exhaustedBefore);
      await ctx.release(locked);

      assert.equal(await candidate.claim(), null);
      failedWithoutReset(exhaustedBefore, await row(exhausted.event.requestId));
      assert.deepEqual(await row(healthy.requestId), healthyLease);
      assert.equal(
        await candidate.complete(healthy.requestId, claimed.lease, {
          requestId: healthy.requestId,
          state: "recorded",
        }),
        true,
      );
      assert.equal((await row(healthy.requestId)).attempts, 1);
    } finally {
      try {
        await ctx.release(locked);
      } finally {
        await ctx.release(progressing);
      }
    }
  },
);

scenario(
  "13 A deterministic bounded sweep drains multiple batches while healthy work is claimed once alongside exhausted rows",
  async (ctx) => {
    const fixtures = await exhaustedPendingCohort(ctx, 5);
    const olderIds = new Set(
      fixtures.slice(-2).map((fixture) => fixture.event.requestId),
    );
    // The two greatest UUIDs are older. Ordering by id alone must fail this
    // oracle; equal-age rows must still respect the UUID tie breaker.
    for (const fixture of fixtures) {
      if (!olderIds.has(fixture.event.requestId)) continue;
      assert.equal(
        (
          await query(
            pool,
            `UPDATE ${TABLE} SET created_at='2024-12-30T00:00:00Z'::timestamptz WHERE id=$1 AND state='pending'`,
            [fixture.event.requestId],
          )
        ).rowCount,
        1,
      );
      fixture.before = await row(fixture.event.requestId);
    }
    fixtures.sort((left, right) => {
      const leftOlder = olderIds.has(left.event.requestId),
        rightOlder = olderIds.has(right.event.requestId);
      if (leftOlder !== rightOlder) return leftOlder ? -1 : 1;
      return left.event.requestId < right.event.requestId ? -1 : 1;
    });
    const healthy = ctx.event();
    const candidate = store(settings.candidate, pool, 5, { sweepBatchSize: 2 });
    await candidate.put(healthy.requestId, healthy);
    const claimed = await candidate.claim();
    own(claimed?.id);
    assert.equal(claimed.id, healthy.requestId);
    assert.equal(claimed.attempts, 1);
    const healthyLease = await row(healthy.requestId);

    for (const finalized of [2, 4, 5]) {
      if (finalized !== 2) assert.equal(await candidate.claim(), null);
      for (let index = 0; index < fixtures.length; index++) {
        const fixture = fixtures[index];
        const observed = await row(fixture.event.requestId);
        if (index < finalized) failedWithoutReset(fixture.before, observed);
        else assert.deepEqual(observed, fixture.before);
      }
      assert.deepEqual(await row(healthy.requestId), healthyLease);
    }
    const terminals = await Promise.all(
      fixtures.map((fixture) => row(fixture.event.requestId)),
    );
    assert.equal(await candidate.claim(), null);
    assert.deepEqual(
      await Promise.all(fixtures.map((fixture) => row(fixture.event.requestId))),
      terminals,
    );
    assert.equal(
      await candidate.complete(healthy.requestId, claimed.lease, {
        requestId: healthy.requestId,
        state: "recorded",
      }),
      true,
    );
    assert.equal((await row(healthy.requestId)).attempts, 1);
  },
);

scenario(
  "14 Concurrent bounded sweep transactions own disjoint batches and preserve recorded and failed terminals under later policy increases",
  async (ctx) => {
    const fixtures = await exhaustedPendingCohort(ctx, 6);
    const terminal = await attempts(ctx, 8, { keepLease: true });
    assert.equal(
      await terminal.old.complete(terminal.event.requestId, terminal.item.lease, {
        requestId: terminal.event.requestId,
        state: "recorded",
      }),
      true,
    );
    const recordedBefore = await row(terminal.event.requestId);
    const leases = [],
      observedBatches = [];
    try {
      for (let index = 0; index < 3; index++) {
        const item = await ctx.lease(ctx.pool());
        leases.push(item);
        await ctx.begin(item);
        await query(item.client, "SET LOCAL statement_timeout='1500ms'");
        await query(item.client, "SET LOCAL lock_timeout='500ms'");
      }
      const stores = leases.map((item) =>
        store(
          settings.candidate,
          {
            query: async (sql, parameters) => {
              const result = await query(item.client, sql, parameters);
              if (sql.startsWith(SWEEP_PREFIX)) {
                assert.equal(result.rowCount, result.rows.length);
                assert.ok(result.rowCount >= 0 && result.rowCount <= 2);
                const ids = result.rows.map((entry) => entry.id);
                ids.forEach(own);
                observedBatches.push(ids);
              }
              return result;
            },
          },
          5,
          { sweepBatchSize: 2 },
        ),
      );
      const results = await Promise.allSettled(stores.map((item) => item.claim()));
      requireCondition(
        results.every((item) => item.status === "fulfilled"),
        OPERATION_FAILURE,
      );
      assert.deepEqual(results.map((item) => item.value), [null, null, null]);
      assert.equal(observedBatches.length, 3);
      assert.deepEqual(
        observedBatches.map((batch) => batch.length).sort(),
        [2, 2, 2],
      );
      const swept = observedBatches.flat();
      assert.equal(new Set(swept).size, 6);
      assert.deepEqual(
        [...swept].sort(),
        fixtures.map((fixture) => fixture.event.requestId),
      );
      // These transactions still hold their disjoint row locks until all three
      // claims have completed. Committing only now prevents a sequential oracle.
      for (const item of leases) await ctx.commit(item);
    } finally {
      const released = await Promise.allSettled(
        leases.map((item) => ctx.release(item)),
      );
      requireCondition(
        released.every((item) => item.status === "fulfilled"),
        OPERATION_FAILURE,
      );
    }
    const failed = [];
    for (const fixture of fixtures) {
      const observed = await row(fixture.event.requestId);
      failedWithoutReset(fixture.before, observed);
      failed.push(observed);
    }
    assert.deepEqual(await row(terminal.event.requestId), recordedBefore);
    for (const max of [12, 20]) {
      assert.equal(
        await store(settings.candidate, pool, max, { sweepBatchSize: 1 }).claim(),
        null,
      );
      assert.deepEqual(
        await Promise.all(fixtures.map((fixture) => row(fixture.event.requestId))),
        failed,
      );
      assert.deepEqual(await row(terminal.event.requestId), recordedBefore);
    }
  },
);

scenario(
  "15 Later higher budgets do not reopen failed events but can claim pending work, while retry at exact budget remains terminal",
  async (ctx) => {
    const exhausted = await attempts(ctx, 8);
    assert.equal(await store(settings.candidate).claim(), null);
    const failed = await row(exhausted.event.requestId);
    assert.equal(failed.state, "failed");
    const higher = store(settings.candidate, pool, 20);
    assert.equal(await higher.claim(), null);
    assert.deepEqual(
      await higher.put(exhausted.event.requestId, exhausted.event),
      { durable: true, id: exhausted.event.requestId, state: "failed" },
    );
    assert.deepEqual(await row(exhausted.event.requestId), failed);
    await assert.rejects(
      higher.put(exhausted.event.requestId, {
        ...exhausted.event,
        message: "Another synthetic payload cannot reuse this identity",
      }),
      { message: OPERATION_FAILURE },
    );
    assert.deepEqual(await row(exhausted.event.requestId), failed);
    await clean([exhausted.event.requestId]);
    await empty();

    const pending = await attempts(ctx, 8);
    await due(pending.event.requestId);
    const beforeHigherClaim = await row(pending.event.requestId);
    const claimed = await higher.claim();
    own(claimed?.id);
    assert.equal(claimed.id, pending.event.requestId);
    assert.equal(claimed.attempts, 9);
    const afterHigherClaim = await row(pending.event.requestId);
    for (const field of ["id", "payload", "fingerprint", "created_at"])
      assert.deepEqual(afterHigherClaim[field], beforeHigherClaim[field], field);
    assert.equal(await higher.retry(claimed.id, claimed.lease), true);
    const higherPending = await row(pending.event.requestId);
    assert.equal(higherPending.state, "pending");
    assert.equal(higherPending.attempts, 9);
    assert.equal(higherPending.error_code, "crm_delivery_unconfirmed");
    await clean([pending.event.requestId]);
    await empty();

    const equal = await attempts(ctx, 4);
    await due(equal.event.requestId);
    const atFive = store(settings.candidate, pool, 5);
    const lastClaim = await atFive.claim();
    own(lastClaim?.id);
    assert.equal(lastClaim.id, equal.event.requestId);
    assert.equal(lastClaim.attempts, 5);
    assert.equal(await atFive.retry(lastClaim.id, lastClaim.lease), true);
    const exactFailed = await row(equal.event.requestId);
    assert.equal(exactFailed.state, "failed");
    assert.equal(exactFailed.attempts, 5);
    assert.equal(exactFailed.error_code, "delivery_exhausted");
    assert.equal(exactFailed.lease, null);
    assert.equal(exactFailed.lease_until, null);
    assert.equal(await higher.claim(), null);
    assert.deepEqual(await row(equal.event.requestId), exactFailed);
  },
);
