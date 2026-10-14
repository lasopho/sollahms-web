// Project only the seven independently reviewed Sento successors when older
// developer suites audit their own historical release. The real Sento suite
// independently checks all 130 other projects and the actual Preview package.
import { readFileSync } from 'node:fs';
import { projectLeonFile, restoreLeonRows } from './leon-main-preservation.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SENTO_SLUGS, restoreSentoRows, restoreSentoContexts, projectSentoFile as publicationProjectSentoFile } from '../scripts/sento-publication.mjs';

export { SENTO_SLUGS, restoreSentoRows, restoreSentoContexts };
const ROOT = fileURLToPath(new URL('../', import.meta.url));
// Exact Git snapshots are the independently validated output boundaries of the
// automatic embed, map and tour policies. Re-projecting one of these outputs
// would restart the chain and overwrite its already verified historical bytes.
const historicalStages = ['3f7b7e481e632e06d36702f556f6f2bca61bc55b', 'f342ae969b53d3e9460803d024b34b06574b294c', 'bb69615d03230cbab76bdc2678938cc741f80e86'];
const historicalHtml = new Map();
export function isVerifiedHistoricalHtml(file, value) {
  if (!file.endsWith('.html')) return false;
  if (!historicalHtml.has(file)) historicalHtml.set(file, historicalStages.map(commit => {
    try { return execFileSync('git', ['show', commit + ':' + file], { cwd: ROOT, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch { return null; }
  }).filter(Boolean));
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return historicalHtml.get(file).some(original => bytes.equals(original));
}
export function projectSentoFile(file, value) {
  if (SENTO_SLUGS.includes(file.replace(/\.html$/, '')) && isVerifiedHistoricalHtml(file, value)) return value;
  return publicationProjectSentoFile(file, projectLeonFile(file, value));
}

export function restoreSentoData(value, file = 'data/proyectos.json') {
  const rows = typeof value === 'string' || Buffer.isBuffer(value) ? JSON.parse(value) : value;
  return restoreSentoRows(restoreLeonRows(rows, file), file);
}

export function readHistoricalSentoFile(file) {
  return projectSentoFile(file, readFileSync(new URL('../' + file, import.meta.url)));
}

// The dated financial fixtures remain fixed at 10 October. Restore only the
// approved historical price provenance for those fixtures while retaining live
// display names, route identities and all other current fields.
export function historicalSentoFinancialRows(rows) {
  const datedRows = restoreLeonRows(rows);
  const historical = restoreSentoRows(datedRows);
  return datedRows.map((row, index) => SENTO_SLUGS.includes(row.slug)
    ? { ...row, precioDesdeUF: historical[index].precioDesdeUF, verificacion: structuredClone(historical[index].verificacion) }
    : row);
}
