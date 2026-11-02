-- REVIEW TEMPLATE ONLY. Run by an authorized migrator in a separate environment.
-- No login, password or external account is created by the application.
CREATE ROLE sollahms_outbox_app NOLOGIN;
GRANT USAGE ON SCHEMA sollahms_private TO sollahms_outbox_app;
GRANT SELECT,INSERT,UPDATE ON sollahms_private.crm_outbox TO sollahms_outbox_app;
CREATE POLICY outbox_server_only ON sollahms_private.crm_outbox
 TO sollahms_outbox_app USING (true) WITH CHECK (true);
-- A DBA grants this capability to the chosen server login separately.
-- Never grant membership to anon, authenticated, PUBLIC or a browser identity.
