// Exact CAT-002/SRC-001 corrections approved on 2026-10-17.
// Historical baselines are immutable. These reverse deltas accept only the
// complete reviewed current file or its exact pre-P1 bytes before projection.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const sha = value => createHash('sha256').update(value).digest('hex');
export const P1_COMMERCIAL_BASELINE = '3866095784367c23bbe33ff0d79e3ed111caade0';
const REVIEW = {
  "data/fichas-proyectos.json": {
    "beforeSha256": "6e2c29f9ff388e6029f30dd8ab22d12dd1655dffb5fe1ad60882756d49c8e440",
    "afterSha256": "aec64d00257833f0ac63f616bb95f70c59d1cbabc66a1df65ed740094733b585",
    "edits": [
      {
        "before": "\"checkedAt\": \"2026-10-10\"",
        "after": "\"checkedAt\": \"2026-10-17\""
      },
      {
        "before": "Desde UF 1.550 para Oficina 202",
        "after": "Desde UF 1.705 para Oficina 406"
      },
      {
        "before": "23,19 m² útiles y 23,19 m² totales",
        "after": "21,00 m² útiles y 21,00 m² totales"
      },
      {
        "before": "Precio desde con máximo descuento publicado; promociones no acumulables. Disponibilidad específica pendiente de confirmación.",
        "after": "Precio desde con máximo descuento publicado; no incluye promociones vigentes. Las promociones reemplazan parte de ese descuento y no son acumulables. Confirma precio, promociones y disponibilidad con el ejecutivo de ventas."
      }
    ]
  },
  "data/registro-fichas.json": {
    "beforeSha256": "a5cf745e40a62b2db6685869dac4d8ee068399dd039d2f6570f93a65b83ad802",
    "afterSha256": "be206aac3bb43fd9a9fbf720e514a8fdc840cc273397c1d1d28f15aa4fe07396",
    "edits": [
      {
        "before": "      \"fechaRevision\": \"2026-10-10\",\n",
        "after": "      \"fechaRevision\": \"2026-10-17\",\n"
      }
    ]
  },
  "edificio-verne.html": {
    "beforeSha256": "f8478aa0d4d301114667e23cd6f8af247a64d3c5c1571923000e2b2b74dbc2a8",
    "afterSha256": "30d7a8bb96197b8b1a701573e5881e388152402b49535c95a4806f8d04783066",
    "edits": [
      {
        "before": "",
        "after": "<div class=\"pending-panel commercial-identity-notice\" role=\"note\"><p>La oferta residencial vigente sigue sin confirmar. Verne Oficinas se presenta por separado como alternativa comercial.</p></div>"
      },
      {
        "before": "Desde UF 1.550 para Oficina 202",
        "after": "Desde UF 1.705 para Oficina 406"
      },
      {
        "before": "23,19 m² útiles y 23,19 m² totales",
        "after": "21,00 m² útiles y 21,00 m² totales"
      },
      {
        "before": "Precio desde con máximo descuento publicado; promociones no acumulables. Disponibilidad específica pendiente de confirmación.",
        "after": "Precio desde con máximo descuento publicado; no incluye promociones vigentes. Las promociones reemplazan parte de ese descuento y no son acumulables. Confirma precio, promociones y disponibilidad con el ejecutivo de ventas."
      }
    ]
  },
  "froilan-roa-5731-torre-norte.html": {
    "beforeSha256": "e65ed4782a3dbe517acd8ad0ecc1d2087969760fe43e18aaabc24aa44555aec6",
    "afterSha256": "75f2ae45325a1163fd79ce07c012a25c15588888a082a435d7bf6228b63d96e6",
    "edits": [
      {
        "before": "",
        "after": "<div class=\"pending-panel commercial-identity-notice\" role=\"note\"><p>La identidad comercial y la oferta vigente de esta etapa siguen sin confirmar. La información del conjunto se muestra por separado.</p></div>"
      }
    ]
  },
  "froilan-roa-5731-torre-sur.html": {
    "beforeSha256": "6f48e40fa458e3c5c6d47054ed70959a85178d6cb563d45cd6cf00c0d3728878",
    "afterSha256": "e278daaf50de5babb8166770376dce113d61b7c887f75bc106dc3dc65eab5767",
    "edits": [
      {
        "before": "",
        "after": "<div class=\"pending-panel commercial-identity-notice\" role=\"note\"><p>La identidad comercial y la oferta vigente de esta etapa siguen sin confirmar. La información del conjunto se muestra por separado.</p></div>"
      }
    ]
  },
  "mapocho-3521-edificio-a.html": {
    "beforeSha256": "91560b5ae4af552d5027aaca4b9cfd4113e01c9d25e76d4ac44cc7f6764b93c2",
    "afterSha256": "26d40562ac341dbc5812f57f3d01f00afa81e23e3ed04d39a3c580f9e17e3721",
    "edits": [
      {
        "before": "",
        "after": "<div class=\"pending-panel commercial-identity-notice\" role=\"note\"><p>La identidad comercial y la oferta vigente de esta etapa siguen sin confirmar. La información del conjunto se muestra por separado.</p></div>"
      }
    ]
  },
  "proyectos.html": {
    "beforeSha256": "c8c15f965f9d644a6d292c76052c124321eb3d68258ca44707474fb33f58020a",
    "afterSha256": "eec0893eddff1ee3030081e0314dd1347f80892c88484f3291b9f845a840175c",
    "edits": [
      {
        "before": "",
        "after": "        const pendingIdentity = ['mapocho-3521-edificio-a', 'froilan-roa-5731-torre-norte', 'froilan-roa-5731-torre-sur', 'edificio-verne'].includes(project.slug);\n        if (pendingIdentity) {\n            const notice = element('p', project.slug === 'edificio-verne'\n                ? 'La oferta residencial vigente sigue sin confirmar. Verne Oficinas se presenta por separado como alternativa comercial.'\n                : 'La identidad comercial y la oferta vigente de esta etapa siguen sin confirmar. La información del conjunto se muestra por separado.', 'commercial-identity-notice text-sm text-secondary mb-4');\n            notice.setAttribute('role', 'note');\n            body.append(notice);\n        }\n"
      }
    ]
  },
  "scripts/build-project-details.py": {
    "beforeSha256": "3294a838d883cd8cf3254b379f55bcf98f4a6f3466a6fda803b642772cd6d4e1",
    "afterSha256": "13abee55e4caab781959719e9590cd0ef7d8b3e95e76aaa85cb14f80de51e9ec",
    "edits": [
      {
        "before": "",
        "after": "PENDING_IDENTITIES = {'mapocho-3521-edificio-a', 'froilan-roa-5731-torre-norte', 'froilan-roa-5731-torre-sur', 'edificio-verne'}\n\ndef identity_notice(slug):\n    \"\"\"Keep an unconfirmed stage/product distinct from its related alternative.\"\"\"\n    if slug not in PENDING_IDENTITIES:\n        return ''\n    notice = ('La oferta residencial vigente sigue sin confirmar. Verne Oficinas se presenta por separado como alternativa comercial.'\n              if slug == 'edificio-verne' else\n              'La identidad comercial y la oferta vigente de esta etapa siguen sin confirmar. La información del conjunto se muestra por separado.')\n    return '<div class=\"pending-panel commercial-identity-notice\" role=\"note\"><p>' + esc(notice) + '</p></div>'\n"
      },
      {
        "before": "",
        "after": "    overview_html = identity_notice(slug) + overview_html\n"
      }
    ]
  }
};
const ROWS = {
  "data/fichas-proyectos.json": {
    "beforeSha256": "890c627d4c3aea7705bf50622134e88ce2bdba91aeb3c8b719fb568c2857fea8",
    "afterSha256": "5e70fa1e3fad9c16fe48b1459135abba4e13b5de62c299683aa96dee023d998e"
  },
  "data/registro-fichas.json": {
    "beforeSha256": "4f04f43253004fa0d87beac440decf98ee8773eae456d3315f41b9acb3f26c67",
    "afterSha256": "60e30e5c299a74f2fcb78cd4c653937b41a2164649d78bb5f5ca58010c7937ea"
  }
};
export const P1_COMMERCIAL_FILES = Object.freeze(Object.keys(REVIEW));

export function projectP1CommercialFile(file, value) {
  const review = REVIEW[file];
  if (!review) return value;
  const digest = sha(value);
  if (digest === review.beforeSha256) return value;
  assert.equal(digest, review.afterSha256, 'Unreviewed P1 commercial changes: ' + file);
  let text = value.toString();
  for (const edit of review.edits) {
    assert.ok(edit.after, 'A P1 projection must not restore a removed arbitrary block');
    assert.equal(text.split(edit.after).length, 2, 'P1 delta must occur exactly once: ' + file);
    text = text.replace(edit.after, edit.before);
  }
  assert.equal(sha(text), review.beforeSha256, 'P1 projection changed unrelated bytes: ' + file);
  return Buffer.from(text);
}

export function projectP1CommercialRows(rows, file) {
  if (!ROWS[file]) return rows;
  const row = rows.find(item => item.slug === 'edificio-verne');
  if (!row) return rows;
  const digest = sha(JSON.stringify(row));
  if (digest !== ROWS[file].afterSha256) {
    // Older developer audits also pass records which predate officialContext.
    // They remain subject to their original complete foreign-record hashes.
    return rows;
  }
  const restored = structuredClone(row);
  if (file === 'data/registro-fichas.json') restored.contextoOficial.fechaRevision = '2026-10-10';
  else {
    restored.officialContext.checkedAt = '2026-10-10';
    const facts = new Map(restored.officialContext.facts.map(item => [item.label, item]));
    facts.get('Precio de oficinas').value = 'Desde UF 1.550 para Oficina 202, modelo 1O + 1B; confirmar stock y condiciones';
    facts.get('Modelo detallado 1O + 1B').value = '1 privado y 1 baño; 23,19 m² útiles y 23,19 m² totales; terraza 0 m²';
    facts.get('Condiciones del precio').value = 'Precio desde con máximo descuento publicado; promociones no acumulables. Disponibilidad específica pendiente de confirmación.';
  }
  assert.equal(sha(JSON.stringify(restored)), ROWS[file].beforeSha256, 'P1 row changed outside the three facts and review date');
  return rows.map(item => item === row ? restored : item);
}
