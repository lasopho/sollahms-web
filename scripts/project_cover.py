"""Apply owner-authorized, verified cover choices without rewriting a fiche."""
import json, re
from pathlib import Path
from bs4 import BeautifulSoup

OVERRIDES = json.loads((Path(__file__).resolve().parents[1] / 'data/project-cover-overrides.json').read_text())

def apply_project_cover(page, project):
    choice = OVERRIDES.get(project['slug'])
    if not choice:
        return page
    def replace(match):
        image = BeautifulSoup(match[2], 'html.parser').img
        image['src'] = choice['path']
        image['alt'] = choice['alt']
        image['width'], image['height'] = choice['width'], choice['height']
        image.attrs.pop('srcset', None)
        return match[1] + str(image)
    return re.sub(r'(<figure\b[^>]*class="ci-visual"[^>]*>\s*(?:<span\b[^>]*>)?)(<img\b[^>]*>)', replace, page, count=1)
