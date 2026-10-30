"""Single authoring source for Sollahms contact formats, rendered at build time.

Static HTML keeps contact information available without JavaScript. Only known
Sollahms numbers are replaced; input examples, client data and third parties
are never inferred from the shape of a telephone number.
"""
import argparse
import json
import re
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


def render(text, config):
    target = formats(config["phone"])
    for old in config.get("previousPhones", []):
        source = formats(old)
        # Replacing the destination only preserves a WhatsApp query verbatim,
        # including percent escapes, message punctuation and HTML ampersands.
        for key in ("visible", "international", "digits"):
            text = text.replace(source[key], target[key])
    return text


def sync(root=ROOT, check=False):
    config = json.loads((ROOT / "data/site-contact.json").read_text())
    changed = []
    for path in sorted(root.glob("*.html")):
        before = path.read_text()
        after = render(before, config)
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
