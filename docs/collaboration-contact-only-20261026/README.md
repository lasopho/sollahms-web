# Collaboration contact-only and fiche footer correction

Published https://sollahms.cl/trabaja-con-nosotros.html from `15fc44d0ef5335af9a4fdccb2f52d8ef5435ae72`, branch `codex/collaboration-contact-only-20261026`. Main unchanged; automatic deployment disabled.

Both collaboration types now collect email OR phone, plus specific consent. No name, RUT, company, experience or optional profile information is requested or accepted. Supplied contacts are validated in browser/server. Phone-only messages omit Reply-To. Existing reception remains Resend → contacto@sollahms.cl. No real emails or applications were sent during QA. Existing commercial/project forms remain unchanged.

120 project footer links were moved into their existing section containers; the shared generator repairs old orphan links and supports privacy anchors. One featured template repaired. All 140 published footer pages checked. Project changes are exclusively footer link relocation; catalogue, 126 map pins, imagery, prices and all unrelated handlers are byte-identical to the preceding artifact.

Validation: 15 automated tests pass, isolated local HTTP receiver, four browser synthetic submissions covering both types × email-only/phone-only, blank/invalid contact and consent errors, keyboard selection, input retention, desktop and 390px mobile, ordinary and featured fiche footer alignment. Final preview rejects submissions as read-only. Public GETs of eight representative pages/modules/data/sitemap returned 200 and exact artifact hashes. Both preview and production verified all 1157 artifact files with the same SHA256. No delivery to an actual mailbox was claimed or tested.

Deployment: `dpl_GUh3TL7dxHP2AJoPVAwVqhg4JUQ9` READY. Rollback retained: `dpl_B5M5RA5Jxh8aoAEo1EQUezyAhLVW` through Vercel request_rollback (not executed). See release.json and package-checks.json.
