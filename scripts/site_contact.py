"""Single authoring source for Sollahms contact formats, rendered at build time.

Static HTML keeps contact information available without JavaScript. Only known
Sollahms numbers are replaced; input examples, client data and third parties
are never inferred from the shape of a telephone number.
"""
import argparse
import json
import re
from urllib.parse import quote
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def formats(phone):
    if not re.fullmatch(r"\+569\d{8}", phone):
        raise ValueError("Expected a Chilean mobile in international format")
    return {
        "international": phone,
        "visible": f"+56 9 {phone[4:8]} {phone[8:]}",
        "digits": phone[1:],
        "tel": "tel:" + phone,
        "whatsapp": "https://wa.me/" + phone[1:],
    }


def render(text, config, project_name=None):
    target = formats(config["phone"])
    for old in config.get("previousPhones", []):
        source = formats(old)
        # Replacing the destination only preserves a WhatsApp query verbatim,
        # including percent escapes, message punctuation and HTML ampersands.
        for key in ("visible", "international", "digits"):
            text = text.replace(source[key], target[key])
    message = (f"Hola, me interesa el proyecto {project_name}. Quisiera recibir información sobre disponibilidad, precios y alternativas de compra."
               if project_name else "Hola, quisiera recibir asesoría inmobiliaria de Sollahms para encontrar una propiedad según mis necesidades.")
    url = target['whatsapp'] + '?text=' + quote(message, safe='')
    text = text.replace('href="' + target['tel'] + '"', 'href="' + url + '"')
    text = text.replace("href='" + target['tel'] + "'", 'href="' + url + '"')
    if '<footer' in text and 'data-sollahms-whatsapp' not in text:
        link = f'<a data-sollahms-whatsapp href="{url}">WhatsApp: {target["visible"]}</a>'
        # Add beside the existing footer links without changing their container.
        pattern = r'(<a\b[^>]*href=[\"\x27]/trabaja-con-nosotros.html[^>]*>.*?</a>)'
        text, count = re.subn(pattern, lambda m: m[0] + link, text, count=1, flags=re.S)
        if not count:
            text = re.sub(r'(<footer\b[^>]*>\s*(?:<div\b[^>]*>)?)', lambda m: m[0] + link, text, count=1)
    return text


def sync(root=ROOT, check=False):
    config = json.loads((ROOT / "data/site-contact.json").read_text())
    changed = []
    projects = {p['slug'] + '.html': p['nombre'] for p in json.loads((ROOT / 'data/proyectos.json').read_text())}
    for path in sorted(root.glob("*.html")):
        before = path.read_text()
        after = render(before, config, projects.get(path.name))
        if before != after:
            changed.append(path.name)
            if not check:
                path.write_text(after)
    if check and changed:
        raise SystemExit("Stale Sollahms phone: " + ", ".join(changed))
    return changed


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    print(json.dumps({"updated": sync(check=args.check)}, ensure_ascii=False))
