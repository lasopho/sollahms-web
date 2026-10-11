import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOfferStatus, getUfStatus, validateDataset } from '../assets/js/mortgage-data.mjs';

const defaultPath = fileURLToPath(new URL('../data/hipotecario.json', import.meta.url));
const path = process.argv[2] ? resolve(process.argv[2]) : defaultPath;
try {
  const data = JSON.parse(await readFile(path, 'utf8'));
  const validation = validateDataset(data);
  if (!validation.valid) {
    console.error(validation.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Datos válidos: ${data.institutions.length} instituciones, ${data.offers.length} alternativas.`);
    const now = process.argv[3] ?? new Date();
    const uf = getUfStatus(data.uf, now);
    console.log(`UF: ${uf.state} (${data.uf.date}); ${uf.message}`);
    for (const offer of data.offers) {
      const status = getOfferStatus(offer, now);
      console.log(`${offer.id}: ${status.state}; ${status.message}`);
    }
  }
} catch (error) {
  console.error(`No se pudo validar el archivo: ${error.message}`);
  process.exitCode = 1;
}
