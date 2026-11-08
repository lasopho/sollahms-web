"""Local, isolated before/after QA for the nine approved corporate copy edits.

No deployment, credentials, provider traffic, real leads or project navigation.
Run: python tests/seo-nine-copy-browser.py
"""

from __future__ import annotations

import hashlib
import json
import math
import mimetypes
import subprocess
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE = "87108f3fc6d10994d456388c106e79a5b538bffc"
OUTPUT = ROOT / "docs/seo-measurement/implementations/2026-11-08-nine-copy/browser"
PAGES = ("index.html", "centro-orientacion.html", "guia-hipotecaria.html", "comparador-hipotecario.html")
VIEWPORTS = {"desktop": {"width": 1440, "height": 1000}, "mobile": {"width": 390, "height": 844}}
BUDGET = {"income": 2000000, "debt": 100000, "savings": 20000000,
          "monthlySavings": 200000, "horizon": 12, "uf": 40000,
          "burden": 25, "down": 20, "years": 25, "rate": 4.5,
          "convention": "effective"}
QUOTES = {"price": 3000, "down": 20, "years": 25, "convention": "nominal", "rateA": 0, "rateB": 5}


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def handler_for(html, journal):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_POST(self):
            # Defense in depth: the browser routes block every API before HTTP.
            journal.append({"method": "POST", "path": urlsplit(self.path).path, "blocked": True})
            self.send_error(405, "This static server never accepts submissions")

        def do_GET(self):
            path = unquote(urlsplit(self.path).path)
            page_name = "index.html" if path == "/" else path.lstrip("/")
            journal.append({"method": "GET", "path": path})
            if page_name in html:
                data, content_type = html[page_name], "text/html; charset=utf-8"
            elif path.startswith("/assets/") or path == "/data/hipotecario.json":
                target = (ROOT / path.lstrip("/")).resolve()
                if not target.is_relative_to(ROOT) or not target.is_file():
                    self.send_error(404)
                    return
                data = target.read_bytes()
                content_type = "text/javascript" if target.suffix in (".mjs", ".js") else mimetypes.guess_type(target.name)[0] or "application/octet-stream"
            else:
                # Other HTML, project catalogues, APIs and bookings are not served.
                self.send_error(404, "Outside this four-page local QA")
                return
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)
    return Handler


FINGERPRINT = r"""() => {
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();
  const attrs = el => Object.fromEntries([...el.attributes]
    .filter(a => !['style','class','aria-invalid'].includes(a.name))
    .map(a => [a.name, a.value]).sort((a,b) => a[0].localeCompare(b[0])));
  const controls = [...document.querySelectorAll('input,select,textarea,button')].map(el => ({
    tag:el.tagName, attributes:attrs(el),
    text:el.tagName === 'SELECT' || el.tagName === 'BUTTON' ? norm(el.textContent) : null,
    options:el.tagName === 'SELECT' ? [...el.options].map(o => [o.value,norm(o.textContent),o.disabled]) : null,
    required:el.required || false, disabled:el.disabled || false
  }));
  const contact = [...document.querySelectorAll('a[href]')].filter(el =>
    /^(?:mailto:|tel:|https:\/\/(?:wa\.me|api\.whatsapp\.com))/.test(el.getAttribute('href')) ||
    /(?:contacto\.html|agenda-asesoria\.html|#solicitar-asesoria|#asesoria$)/.test(el.getAttribute('href'))
  ).map(el => ({attributes:attrs(el), text:norm(el.textContent)}));
  const consent = [...document.querySelectorAll('input[name="consent"]')].map(el => {
    const label = el.closest('label') || document.querySelector('label[for="'+el.id+'"]');
    return {attributes:attrs(el), text:norm(label?.textContent)};
  });
  return {forms:[...document.forms].map(el => attrs(el)),controls,consent,contact};
}"""

OVERFLOW = """() => ({viewport:innerWidth, documentWidth:document.documentElement.scrollWidth,
  bodyWidth:document.body.scrollWidth, overflow:document.documentElement.scrollWidth>innerWidth+1,
  elements:[...document.querySelectorAll('main *')].filter(el => {
    const r=el.getBoundingClientRect();return r.width && (r.right>innerWidth+1 || r.left < -1) && getComputedStyle(el).display!=='none';
  }).slice(0,8).map(el=>({tag:el.tagName,id:el.id,className:String(el.className).slice(0,100)}))})"""


def fill_form(page, form, values):
    for name, value in values.items():
        field = page.locator(f"#{form} [name='{name}']")
        if field.evaluate("el => el.tagName") == "SELECT":
            field.select_option(str(value))
        else:
            field.fill(str(value))


def capture(page, locator, filename):
    target = page.locator(locator).first
    target.wait_for(state="visible")
    # Use genuine scroll behavior/opacity. Do not inject styles or disable motion.
    target.evaluate("el => {const r=el.getBoundingClientRect(); window.scrollTo({top:scrollY+r.top-(innerHeight-Math.min(r.height,innerHeight*.6))/2,behavior:'instant'});}")
    page.wait_for_timeout(220)
    path = OUTPUT / filename
    page.screenshot(path=str(path), full_page=False)
    return {"file": filename, "selector": locator, "viewportOnly": True,
            "scrollY": page.evaluate("scrollY"), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def exercise(page, filename):
    numbers = {}
    if filename == "comparador-hipotecario.html":
        page.wait_for_function("!document.getElementById('simulation-fields').disabled")
        page.locator("#property").fill("4000")
        page.locator("#down").fill("20")
        page.locator("#years").select_option("20")
        page.locator("#rate").fill("4.5")
        # The advanced select remains inside a closed details element by default.
        page.locator("details.advanced summary").click()
        page.locator("#convention").select_option("effective")
        page.locator("#simulation-form button[type=submit]").click()
        page.wait_for_function("!document.getElementById('lead-open').disabled")
        keys = ["monthly-uf", "result-property", "result-down", "result-principal", "result-rate", "result-interest", "result-total", "result-insurance", "result-cost", "monthly-clp"]
        numbers = {key: page.locator("#" + key).inner_text() for key in keys}
        page.locator("#lead-open").click()
        page.locator("#lead-section").wait_for(state="visible")
    elif filename == "guia-hipotecaria.html":
        page.locator("#gh-example").click()
        page.locator("#gh-results").wait_for(state="visible")
        keys = ["gh-payment", "gh-payment-insurance", "gh-down-result", "gh-principal-result", "gh-interest-result", "gh-total-base", "gh-initial-result", "gh-total-known"]
        numbers = {key: page.locator("#" + key + " [data-uf]").inner_text() for key in keys}
        # The amortization table sits in a closed disclosure: text_content checks
        # its actual computed rows even while the table is not visually expanded.
        numbers["schedule"] = page.locator("#gh-schedule").text_content()
        numbers["scheduleRows"] = page.locator("#gh-schedule tr").count()
        if numbers["scheduleRows"] != 20:
            raise AssertionError("Guide no longer renders the 20-year schedule")
        numbers["engineMonthlyBaseUf"] = page.evaluate("""async () => {
          const {calculateGuide}=await import('/assets/js/mortgage-guide-engine.mjs?v=20261029-euro-1');
          return calculateGuide({propertyUf:4000,downMode:'percent',downValue:20,annualRatePercent:4,rateConvention:'nominal',years:20}).monthlyBaseUf;
        }""")
        if not math.isclose(numbers["engineMonthlyBaseUf"], 19.391370537581395, abs_tol=1e-10):
            raise AssertionError("Guide engine no longer matches the independently established reference")
        if numbers["gh-payment"] != "UF 19,39":
            raise AssertionError("Guide rendered payment is not UF 19,39")
    elif filename == "centro-orientacion.html":
        page.wait_for_function("!document.querySelector('#budget-form fieldset').disabled")
        fill_form(page, "budget-form", BUDGET)
        page.locator("#budget-form button[type=submit]").click()
        page.wait_for_function("document.getElementById('budget-result').dataset.calculated==='true'")
        numbers["budget"] = page.locator("#budget-result").inner_text()
        fill_form(page, "quotes-form", QUOTES)
        page.locator("#quotes-form button[type=submit]").click()
        page.wait_for_function("document.querySelector('#quotes-result h3')!==null")
        numbers["quotes"] = page.locator("#quotes-result").inner_text()
        if "400.000" not in numbers["budget"] or "560" not in numbers["budget"]:
            raise AssertionError("Budget no longer displays the expected monthly limit/savings")
        if "8 UF" not in numbers["quotes"]:
            raise AssertionError("Zero-rate quote A no longer displays 8 UF")
    return numbers


def run_case(browser, origin, label, viewport_name, filename):
    context = browser.new_context(viewport=VIEWPORTS[viewport_name], locale="es-CL", timezone_id="America/Santiago", service_workers="block")
    page = context.new_page()
    events = {"pageErrors": [], "consoleErrors": [], "blockedRemote": [], "apiFixtures": [], "failedLocal": []}

    def route_request(route):
        request = route.request
        parsed = urlsplit(request.url)
        if parsed.path.startswith("/api/"):
            events["apiFixtures"].append({"path": parsed.path, "method": request.method})
            if parsed.path == "/api/uf":
                route.fulfill(status=200, content_type="application/json", body='{"uf":null}')
            else:
                route.fulfill(status=503, content_type="application/json", body='{"ok":false,"code":"preview_read_only","error":"Prueba local sin envío."}')
        elif parsed.netloc == urlsplit(origin).netloc and request.method == "GET":
            # No additional pages (and hence no fiche/contact/agenda navigation).
            if request.is_navigation_request() and parsed.path not in ("/", "/" + filename):
                route.abort()
            else:
                route.continue_()
        else:
            events["blockedRemote"].append({"url": request.url, "resourceType": request.resource_type})
            route.abort()

    context.route("**/*", route_request)
    page.on("pageerror", lambda err: events["pageErrors"].append(str(err)))
    page.on("console", lambda msg: events["consoleErrors"].append({"text": msg.text, "location": msg.location}) if msg.type == "error" else None)
    page.on("response", lambda response: events["failedLocal"].append({"url": response.url.replace(origin, "LOCAL"), "status": response.status}) if response.status >= 400 else None)
    result = {"page": filename, "version": label, "viewport": VIEWPORTS[viewport_name], "events": events, "captures": []}
    try:
        page.goto(origin + ("/" if filename == "index.html" else "/" + filename), wait_until="networkidle")
        page.wait_for_timeout(250)
        result["initialOverflow"] = page.evaluate(OVERFLOW)
        result["fingerprintBeforeInteraction"] = page.evaluate(FINGERPRINT)
        result["numbers"] = exercise(page, filename)
        result["fingerprintAfterInteraction"] = page.evaluate(FINGERPRINT)
        result["finalOverflow"] = page.evaluate(OVERFLOW)
        # Native validation only: no submit event and no financial or personal data sent.
        result["emptyCommercialFormsInvalid"] = page.evaluate("""() => [...document.forms]
          .filter(form=>form.querySelector('input[name="consent"]'))
          .map(form=>({id:form.id,invalid:!form.checkValidity(),consentRequired:form.elements.consent.required,consentChecked:form.elements.consent.checked}))""")
        if label == "candidate":
            targets = {
                "index.html": [("H02-home-hero", ".home-seo-hero-copy"), ("H03-home-process", "#como-te-ayudamos .home-seo-steps li:first-child")],
                "centro-orientacion.html": [("O01-orientation-ruta", '#ruta p:has-text("No necesitas tener todas")'), ("O02-orientation-cotizaciones", '#cotizaciones p:has-text("Revisa la fuente y la fecha de cada referencia")')],
                "guia-hipotecaria.html": [("G01-guide-next", ".gh-next")],
                "comparador-hipotecario.html": [("C01-comparator-intro", ".hero-copy"), ("C02-comparator-down-help", '#down-presets ~ .field-help'), ("C03-comparator-lead-intro", '#lead-section p:has-text("Puedes solicitar orientación a Sollahms")')],
            }[filename]
            for name, selector in targets:
                result["captures"].append(capture(page, selector, f"{viewport_name}-{name}.png"))
        result["completed"] = True
    except Exception as exc:
        result["completed"] = False
        result["failure"] = f"{type(exc).__name__}: {exc}"
    finally:
        context.close()
    return result


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    baseline = {name: subprocess.check_output(["git", "show", f"{BASE}:{name}"], cwd=ROOT) for name in PAGES}
    candidate = {name: (ROOT / name).read_bytes() for name in PAGES}
    journal = {"baseline": [], "candidate": []}
    servers = {label: ThreadingHTTPServer(("127.0.0.1", 0), handler_for(html, journal[label])) for label, html in (("baseline", baseline), ("candidate", candidate))}
    for server in servers.values():
        threading.Thread(target=server.serve_forever, daemon=True).start()
    report = {"startedAtUtc": datetime.now(timezone.utc).isoformat(), "baseCommit": BASE,
              "command": "python tests/seo-nine-copy-browser.py", "chromiumExecutable": "/usr/bin/chromium",
              "isolation": {"localStaticOnly": True, "ufFixture": {"uf": None}, "otherApi": "503 preview_read_only", "realSubmissions": False,
                            "fixturesAreMeasurement": False, "screenshots": "Actual retained styles and scroll-presence, viewport captures; no CSS injection."},
              "inputs": {"comparator": {"propertyUf":4000,"downPaymentPercent":20,"years":20,"annualRatePercent":4.5,"rateConvention":"effective"}, "guide": {"propertyUf":4000,"downValue":20,"annualRatePercent":4,"rateConvention":"nominal","years":20}, "budget":BUDGET,"quotes":QUOTES},
              "htmlSha256": {label:{name:hashlib.sha256(data).hexdigest() for name,data in html.items()} for label,html in (("baseline",baseline),("candidate",candidate))},
              "cases": [], "comparisons": []}
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox", "--disable-background-networking"])
            for viewport_name in VIEWPORTS:
                for filename in PAGES:
                    pair = []
                    for label, server in servers.items():
                        result = run_case(browser, f"http://127.0.0.1:{server.server_port}", label, viewport_name, filename)
                        report["cases"].append(result)
                        pair.append(result)
                        print(json.dumps({"viewport":viewport_name,"page":filename,"version":label,"completed":result["completed"],"failure":result.get("failure")}), flush=True)
                    before, after = pair
                    comparison = {"viewport":viewport_name,"page":filename,"completed":all(item["completed"] for item in pair)}
                    if comparison["completed"]:
                        def console_signature(item):
                            return sorted((event["text"], urlsplit(event["location"].get("url", "")).path)
                                          for event in item["events"]["consoleErrors"])

                        comparison.update({"numbersIdentical":before["numbers"]==after["numbers"],
                                           "initialFormsControlsConsentContactIdentical":before["fingerprintBeforeInteraction"]==after["fingerprintBeforeInteraction"],
                                           "exercisedFormsControlsConsentContactIdentical":before["fingerprintAfterInteraction"]==after["fingerprintAfterInteraction"],
                                           "pageErrorsBefore":before["events"]["pageErrors"], "pageErrorsAfter":after["events"]["pageErrors"],
                                           "noNewPageErrors":after["events"]["pageErrors"]==before["events"]["pageErrors"],
                                           "consoleErrorsIdentical":console_signature(before)==console_signature(after),
                                           "remoteResourcesBlockedIdentically":before["events"]["blockedRemote"]==after["events"]["blockedRemote"],
                                           "noInitialHorizontalOverflow":not after["initialOverflow"]["overflow"],
                                           "noExercisedHorizontalOverflow":not after["finalOverflow"]["overflow"],
                                           "emptyCommercialFormsInvalid":all(item["invalid"] and item["consentRequired"] and not item["consentChecked"] for item in after["emptyCommercialFormsInvalid"])})
                        for label, item in zip(("before", "after"), pair):
                            comparison[label+"FingerprintSha256"] = digest(item["fingerprintAfterInteraction"])
                        comparison["passed"] = all(comparison[key] for key in ["numbersIdentical","initialFormsControlsConsentContactIdentical","exercisedFormsControlsConsentContactIdentical","noNewPageErrors","consoleErrorsIdentical","remoteResourcesBlockedIdentically","noInitialHorizontalOverflow","noExercisedHorizontalOverflow","emptyCommercialFormsInvalid"])
                    else:
                        comparison["passed"] = False
                    report["comparisons"].append(comparison)
            browser.close()
    finally:
        for server in servers.values():
            server.shutdown()
            server.server_close()
        report["staticServerRequests"] = journal
        report["completedAtUtc"] = datetime.now(timezone.utc).isoformat()
        report["passed"] = len(report["comparisons"])==8 and all(item["passed"] for item in report["comparisons"])
        # Browser console failures from aborted remote fonts are explicit environment
        # limitations; application exceptions remain separately visible above.
        report["consoleClassification"] = "Remote resources are blocked intentionally. See per-case blockedRemote, consoleErrors, failedLocal and pageErrors; an aborted font request is not a JavaScript exception."
        (OUTPUT / "results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
    print(json.dumps({"passed": report["passed"], "results": str(OUTPUT / "results.json"), "comparisons": report["comparisons"]}, ensure_ascii=False), flush=True)
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
