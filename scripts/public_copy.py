"""Shared natural-caption rules; private documentary captions stay unchanged."""
import json
import re
from pathlib import Path

POLICY = json.loads((Path(__file__).resolve().parents[1] / 'data/public-caption-policy.json').read_text())

def apply_rules(value, rules):
    for rule in rules:
        replacement = re.sub(r'\$(\d+)', lambda m: '\\g<' + m[1] + '>', rule['replacement'])
        value = re.sub(rule['pattern'], replacement, value, flags=re.I)
    return value

def natural_caption(value):
    return re.sub(r'\s{2,}', ' ', apply_rules(str(value), POLICY['captionRules'])).strip()

def natural_text(value):
    return apply_rules(value, POLICY['textRules'])
