BEGIN;
CREATE SCHEMA IF NOT EXISTS sollahms_private;
REVOKE ALL ON SCHEMA sollahms_private FROM PUBLIC;
CREATE TABLE IF NOT EXISTS sollahms_private.crm_outbox (
 id uuid PRIMARY KEY,
 fingerprint text NOT NULL CHECK(length(fingerprint)=64),
 payload jsonb NOT NULL CHECK(octet_length(payload::text)<=65536),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','leased','recorded','failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 available_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 lease uuid, lease_until timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 recorded_at timestamptz, receipt jsonb, error_code text,
 CHECK((state='leased' AND lease IS NOT NULL AND lease_until IS NOT NULL) OR (state<>'leased' AND lease IS NULL AND lease_until IS NULL)),
 CHECK(state<>'recorded' OR (recorded_at IS NOT NULL AND receipt IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS crm_outbox_due ON sollahms_private.crm_outbox(available_at,created_at) WHERE state IN ('pending','leased');
ALTER TABLE sollahms_private.crm_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON sollahms_private.crm_outbox FROM PUBLIC;
COMMIT;
