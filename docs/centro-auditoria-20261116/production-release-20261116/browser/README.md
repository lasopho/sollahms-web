# Browser verification for the Centro production release

`qa.mjs` performs a focused smoke test of the delivered release in Chrome at
1440, 1024, 768, 390 and 320 px. It does not repeat the previously certified unit,
contrast or external-link suites.

Run only after the coordinator confirms the exact new deployment is READY:

```sh
node docs/centro-auditoria-20261116/production-release-20261116/browser/qa.mjs /absolute/path/to/target-isolated.json
```

The target contains `phase: "isolated"`, the exact immutable HTTPS `origin`, and
the new `deployment` ID. This phase obtains real authenticated application
responses through the existing Vercel CLI transport and its deployment-scoped
cache. It never substitutes workspace source files for delivered assets.

After the coordinator confirms promotion of that same deployment, the public
target contains `phase: "public"`, `origin: "https://sollahms.cl"`, the same
deployment ID and `promotionConfirmed: true`. Public static resources use real
Chrome network requests. Do not execute the public phase before that confirmation.

Both phases block non-GET/HEAD methods, unsafe API paths and external calls. The
UF endpoint alone receives an explicit unavailable-service fixture so the smoke
test exercises manual UF without provider access. The administrative Vercel
feedback toolbar is suppressed and recorded separately. No commercial form
fields are filled and the contact form has a capture-phase submit guard; any
contact submit event fails verification.

Each phase saves `results.json` and four captures per width: page, initial result
panel, calculated result and final journey stage. A control, layout, resource or
unexpected console failure stops the run immediately and records its current
width and case. Publication must stop for coordinator review if the isolated
phase fails. A public failure requires immediate coordinator notification.

The independent arithmetic reference is 3,750 UF: monthly budget CLP400,000,
UF40,000, 300 months, zero interest and 20% down payment. The quote reference is
8 UF per month for UF2,400 principal over 300 months at zero interest. All values
are synthetic browser-only inputs; no lead, reservation, message or provider
write is sent.
