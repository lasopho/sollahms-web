import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';

const PREFIX = 'bonos-pie/v1/';
const SESSION = '__Host-sollahms-bonos-session';
const CHALLENGE = '__Host-sollahms-bonos-challenge';
const ORIGIN = 'https://sollahms.cl';
const STATES = new Set(['confirmed', 'conditional', 'promotion_only', 'no_information', 'not_found', 'pending']);
const ASSETS = new Set(['panel.css', 'panel.js', 'login.css', 'login.js']);
const digest = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' &&
  Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const nowIso = now => new Date(now).toISOString();

export class Conflict extends Error {}
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const blobStore = {
  async read(key) {
    const result = await get(PREFIX + key, { access: 'private', useCache: false, storeId: process.env.BONOS_STORE_ID });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error('Private store unavailable');
    return { value: JSON.parse(await new Response(result.stream).text()), etag: result.blob.etag };
  },
  async write(key, value, previous, temporary = false) {
    try {
      const result = await put(PREFIX + key, JSON.stringify(value), {
        access: 'private', storeId: process.env.BONOS_STORE_ID,
        contentType: 'application/json', addRandomSuffix: false,
        allowOverwrite: Boolean(previous), ...(previous ? { ifMatch: previous } : {}),
        cacheControlMaxAge: 60, ...(temporary ? { ttlDays: 1 } : {}),
      });
      return result.etag;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError || /already exists/i.test(error.message ?? '')) throw new Conflict();
      throw error;
    }
  },
};

function cookies(req) {
  const result = {};
  for (const part of String(req.headers.cookie ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) {
      const name = part.slice(0, index).trim();
      // Duplicate security cookies are ambiguous. Refuse both.
      result[name] = Object.hasOwn(result, name) ? '' : part.slice(index + 1).trim();
    }
  }
  return result;
}
function cookie(name, value, seconds) {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}`;
}
function securityHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Vary', 'Cookie');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}
function send(res, status, value, type = 'application/json; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
}
function redirect(res, location) {
  res.statusCode = 303;
  res.setHeader('Location', location);
  res.end();
}
function sameOrigin(req, env) {
  const origins = new Set([ORIGIN]);
  // This hostname is injected by Vercel, never taken from an incoming Host header.
  if (/^[a-z0-9-]+\.vercel\.app$/.test(env.VERCEL_URL ?? '')) origins.add('https://' + env.VERCEL_URL);
  if (!origins.has(req.headers.origin) || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin'))
    throw new HttpError(403, 'Origen no autorizado.');
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? ''))
    throw new HttpError(415, 'Se requiere JSON.');
}
async function body(req) {
  const max = 2_000_000;
  if (Number(req.headers['content-length'] ?? 0) > max) throw new HttpError(413, 'Archivo demasiado grande.');
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? String(req.body) : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > max) throw new HttpError(413, 'Archivo demasiado grande.');
    try { return JSON.parse(raw); } catch { throw new HttpError(400, 'JSON inválido.'); }
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > max) throw new HttpError(413, 'Archivo demasiado grande.');
    chunks.push(bytes);
  }
  try {
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
    return JSON.parse(raw || '{}');
  } catch { throw new HttpError(400, 'JSON inválido.'); }
}
function text(value, max = 8000) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))
    throw new HttpError(400, 'Texto inválido en la verificación.');
  return value.trim();
}
function date(value, required = false) {
  if (!value && !required) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) || !Number.isFinite(Date.parse(value)))
    throw new HttpError(400, 'Fecha inválida.');
  return value;
}
function numeric(value, max) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > max) throw new HttpError(400, 'Beneficio numérico inválido.');
  return value;
}
function irisUrl(value) {
  if (!value) return null;
  let url;
  try { url = new URL(value); } catch { throw new HttpError(400, 'Enlace Iris inválido.'); }
  if (url.origin !== 'https://iris.yapo.cl' || !/^\/proyecto\/\d+\/?$/.test(url.pathname) || url.username || url.password)
    throw new HttpError(400, 'Se requiere una ficha individual de Iris.');
  // Only the public project identifier survives; never import a token or session query.
  return url.origin + url.pathname;
}

export function validateRecord(input, project, now) {
  if (!input || typeof input !== 'object' || !STATES.has(input.status)) throw new HttpError(400, 'Estado de verificación inválido.');
  const status = input.status;
  const percentage = numeric(input.percentage, 100);
  const percentageKind = input.percentageKind ?? 'unknown';
  if (!['maximum', 'minimum', 'exact', 'range', 'unknown'].includes(percentageKind)) throw new HttpError(400, 'Tipo de porcentaje inválido.');
  const percentageMax = numeric(input.percentageMax, 100);
  if (percentageMax !== null && (percentage === null || percentageMax < percentage || percentageKind !== 'range'))
    throw new HttpError(400, 'Rango de porcentaje inválido.');
  const amountUf = numeric(input.amountUf, 1_000_000);
  const checkedAt = date(input.checkedAt, status !== 'pending');
  if (checkedAt && Date.parse(checkedAt) > now + 300_000) throw new HttpError(400, 'La consulta no puede tener fecha futura.');
  const url = irisUrl(input.irisUrl);
  const evidence = (input.evidence ?? []).map(item => {
    if (!item || typeof item !== 'object') throw new HttpError(400, 'Evidencia inválida.');
    return { quote: text(item.quote, 16000), section: text(item.section ?? '', 200),
      capturedAt: date(item.capturedAt ?? checkedAt, true), sha256: item.sha256 ? text(item.sha256, 64) : null };
  });
  if (evidence.length > 20) throw new HttpError(400, 'Demasiadas evidencias.');
  if (status !== 'pending' && !evidence.some(e => e.quote)) throw new HttpError(400, 'La clasificación requiere evidencia de la consulta.');
  if (['confirmed', 'conditional', 'promotion_only', 'no_information'].includes(status) && !url)
    throw new HttpError(400, 'La consulta requiere la ficha de Iris.');
  if (['confirmed', 'conditional'].includes(status) && !evidence.some(e => /bono\s*(?:de\s*)?pie/i.test(e.quote.replace(/no\s+tiene\s+bono\s*(?:de\s*)?pie/gi, ''))))
    throw new HttpError(400, 'Bono pie requiere evidencia explícita.');
  if (!['confirmed', 'conditional'].includes(status) && (percentage !== null || amountUf !== null))
    throw new HttpError(400, 'No se puede asignar bono a una promoción sin confirmar.');
  const identity = input.identity ?? {};
  if (status !== 'pending' && status !== 'not_found' &&
      (!identity.name || !identity.developer || !identity.location || identity.validated !== true))
    throw new HttpError(400, 'Valida nombre, inmobiliaria y ubicación de la ficha.');
  return { id: project.id, status, percentage, percentageKind, percentageMax, amountUf, irisUrl: url, checkedAt,
    conditions: text(input.conditions ?? ''), units: text(input.units ?? ''), validUntil: date(input.validUntil),
    validityNote: text(input.validityNote ?? '', 2000),
    identity: { name: text(identity.name ?? '', 300), developer: text(identity.developer ?? '', 300),
      location: text(identity.location ?? '', 1000), validated: identity.validated === true }, evidence,
    note: text(input.note ?? '', 4000), source: 'Iris / Yapo' };
}

export function presentData(state, now) {
  const projects = state.projects.map(project => {
    const row = state.records[project.id] ?? { status: 'pending', percentage: null, amountUf: null,
      conditions: '', units: '', validUntil: null, checkedAt: null, evidence: [], irisUrl: project.irisUrl ?? null };
    const expiry = row.validUntil ? Date.parse(row.validUntil.length === 10 ? row.validUntil + 'T23:59:59-03:00' : row.validUntil) : null;
    return { ...project, ...row, expired: expiry !== null && expiry < now,
      stale: row.checkedAt ? now - Date.parse(row.checkedAt) > 30 * 86400_000 : false };
  });
  const bonus = projects.filter(p => ['confirmed', 'conditional'].includes(p.status) && !p.expired);
  return { version: state.version, projects, history: state.history ?? [],
    stats: { total: projects.length, reviewed: projects.filter(p => p.status !== 'pending').length,
      withBonus: bonus.length, withPercentage: bonus.filter(p => p.percentage !== null).length,
      pending: projects.filter(p => p.status === 'pending' || p.status === 'no_information' || p.status === 'not_found' || p.expired || p.stale).length,
      lastUpdated: state.updatedAt ?? null },
    refresh: { automaticIris: false, mode: 'Consulta manual autorizada en Iris; importación privada de verificaciones.' } };
}

export function createHandler({ store = blobStore, clock = Date.now, env = process.env,
  random = () => randomBytes(32).toString('base64url'), code = () => String(randomInt(0, 100_000_000)).padStart(8, '0'),
  inventory, asset, sendMail } = {}) {
  let baseInventory;
  const loadInventory = async () => inventory ?? (baseInventory ??= JSON.parse(await readFile(new URL('./inventory.json', import.meta.url), 'utf8')));
  const loadAsset = asset ?? (file => readFile(new URL('./ui/' + file, import.meta.url), 'utf8'));
  const hashCode = (challenge, value) => createHmac('sha256', env.BONOS_AUTH_SECRET).update(challenge + ':' + value).digest('hex');
  const mail = sendMail ?? (async value => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(15_000),
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'bonos-login/' + value.requestId },
      body: JSON.stringify({ from: 'Sollahms Web <formularios@forms.sollahms.cl>', to: [env.BONOS_ADMIN_EMAIL],
        subject: 'Código de acceso al panel privado Sollahms',
        text: `Tu código de acceso al panel privado de bonos pie es: ${value.code}\n\nVence en 10 minutos. Úsalo únicamente en https://sollahms.cl/interno/bonos-pie/acceso. No lo compartas. Si no solicitaste acceso, ignora este mensaje.` }),
    });
    if (!response.ok) throw new Error('Authentication email unavailable');
  });
  async function session(req) {
    const value = cookies(req)[SESSION];
    if (!/^[A-Za-z0-9_-]{43}$/.test(value ?? '')) return null;
    const record = await store.read('auth/session-' + digest(value) + '.json');
    if (!record || record.value.expiresAt <= clock() || record.value.revoked ||
        !equal(record.value.adminEmail, env.BONOS_ADMIN_EMAIL)) return null;
    return { ...record, key: 'auth/session-' + digest(value) + '.json' };
  }
  async function dataState() {
    const current = await store.read('data.json');
    if (current) return current;
    const base = await loadInventory();
    return { etag: null, value: { schemaVersion: 1, version: 0, updatedAt: null,
      inventoryObservedAt: base.observedAtUtc, inventoryDeployment: base.deploymentId,
      projects: base.projects.map(p => ({ id: p.projectId, name: p.name, developer: p.developer,
        commune: p.commune, region: p.region, publicUrl: p.publicUrl, irisUrl: p.irisUrl ?? null })), records: {}, history: [] } };
  }
  return async function handler(req, res) {
    securityHeaders(res);
    try {
      const url = new URL(req.url, ORIGIN);
      const op = url.searchParams.get('op') ?? '';
      const method = req.method ?? 'GET';
      if (!env.BONOS_AUTH_SECRET || env.BONOS_AUTH_SECRET.length < 40 || !env.BONOS_ADMIN_EMAIL ||
          (!sendMail && !env.RESEND_API_KEY) || (!store || (store === blobStore && !env.BONOS_STORE_ID)))
        throw new HttpError(503, 'Acceso privado temporalmente no disponible.');
      if (method === 'OPTIONS') throw new HttpError(405, 'Método no permitido.');
      if (op === 'request-code') {
        if (method !== 'POST') throw new HttpError(405, 'Método no permitido.');
        sameOrigin(req, env); await body(req);
        const now = clock();
        const budget = await store.read('auth/login-budget.json');
        const active = budget?.value.windowStart > now - 3600_000;
        if (budget && (now - budget.value.lastSent < 60_000 || (active && budget.value.count >= 6)))
          throw new HttpError(429, 'Espera antes de solicitar otro código.');
        await store.write('auth/login-budget.json', { windowStart: active ? budget.value.windowStart : now,
          count: active ? budget.value.count + 1 : 1, lastSent: now }, budget?.etag, true);
        const challenge = random(), value = code();
        const key = 'auth/challenge-' + digest(challenge) + '.json';
        await store.write(key, { codeHash: hashCode(challenge, value), expiresAt: now + 600_000, attempts: 0, used: false }, null, true);
        await mail({ code: value, requestId: digest(challenge) });
        res.setHeader('Set-Cookie', cookie(CHALLENGE, challenge, 600));
        return send(res, 200, { ok: true, message: 'Código enviado a la cuenta administradora autorizada.' });
      }
      if (op === 'verify-code') {
        if (method !== 'POST') throw new HttpError(405, 'Método no permitido.');
        sameOrigin(req, env);
        const input = await body(req), challenge = cookies(req)[CHALLENGE];
        if (!/^[A-Za-z0-9_-]{43}$/.test(challenge ?? '') || !/^\d{8}$/.test(input.code ?? ''))
          throw new HttpError(401, 'Código inválido o vencido.');
        const key = 'auth/challenge-' + digest(challenge) + '.json', row = await store.read(key);
        if (!row || row.value.expiresAt <= clock() || row.value.used || row.value.attempts >= 5)
          throw new HttpError(401, 'Código inválido o vencido.');
        const valid = equal(hashCode(challenge, input.code), row.value.codeHash);
        await store.write(key, { ...row.value, attempts: row.value.attempts + 1, used: valid }, row.etag, true);
        if (!valid) throw new HttpError(401, 'Código inválido o vencido.');
        const token = random();
        await store.write('auth/session-' + digest(token) + '.json', { adminEmail: env.BONOS_ADMIN_EMAIL,
          expiresAt: clock() + 8 * 3600_000, csrfToken: random(), revoked: false }, null, true);
        res.setHeader('Set-Cookie', [cookie(SESSION, token, 8 * 3600), cookie(CHALLENGE, '', 0)]);
        return send(res, 200, { ok: true });
      }
      if (op === 'asset') {
        if (method !== 'GET') throw new HttpError(405, 'Método no permitido.');
        const file = url.searchParams.get('file');
        if (!ASSETS.has(file)) throw new HttpError(404, 'No encontrado.');
        if (file.startsWith('panel.') && !await session(req)) throw new HttpError(401, 'Inicia sesión.');
        return send(res, 200, await loadAsset(file), file.endsWith('.css') ? 'text/css; charset=utf-8' : 'application/javascript; charset=utf-8');
      }
      const currentSession = await session(req);
      if (!op || op === 'login') {
        if (method !== 'GET' && method !== 'HEAD') throw new HttpError(405, 'Método no permitido.');
        const login = op === 'login' || /\/acceso\/?$/.test(url.pathname);
        if (!currentSession && !login) return redirect(res, '/interno/bonos-pie/acceso');
        if (currentSession && login) return redirect(res, '/interno/bonos-pie');
        return send(res, 200, method === 'HEAD' ? '' : await loadAsset(login ? 'login.html' : 'panel.html'), 'text/html; charset=utf-8');
      }
      if (!currentSession) throw new HttpError(401, 'Inicia sesión para consultar el panel.');
      if (method !== 'GET') {
        sameOrigin(req, env);
        if (!equal(req.headers['x-csrf-token'], currentSession.value.csrfToken)) throw new HttpError(403, 'Sesión de formulario inválida. Recarga los datos.');
      }
      if (op === 'logout' && method === 'POST') {
        await store.write(currentSession.key, { ...currentSession.value, revoked: true }, currentSession.etag, true);
        res.setHeader('Set-Cookie', cookie(SESSION, '', 0));
        return send(res, 200, { ok: true });
      }
      if (op === 'data' && method === 'GET') {
        const state = await dataState();
        return send(res, 200, { ...presentData(state.value, clock()), csrfToken: currentSession.value.csrfToken, adminEmail: env.BONOS_ADMIN_EMAIL });
      }
      if (op === 'data' && method === 'PUT') {
        const input = await body(req), current = await dataState();
        if (input.expectedVersion !== current.value.version) throw new HttpError(409, 'Los datos cambiaron. Recárgalos antes de importar.');
        if (!Array.isArray(input.records) || input.records.length < 1 || input.records.length > 500) throw new HttpError(400, 'Se requiere un lote de verificaciones.');
        const projects = new Map(current.value.projects.map(p => [p.id, p]));
        const records = { ...current.value.records }, changes = [], seen = new Set();
        for (const row of input.records) {
          if (!row || !projects.has(row.id) || seen.has(row.id)) throw new HttpError(400, 'Proyecto desconocido o duplicado.');
          seen.add(row.id);
          const result = validateRecord(row, projects.get(row.id), clock());
          const prior = records[row.id] ?? null;
          if (prior?.checkedAt && Date.parse(result.checkedAt ?? 0) < Date.parse(prior.checkedAt)) throw new HttpError(400, 'No se admite reemplazar una consulta por evidencia anterior.');
          if (JSON.stringify(prior) !== JSON.stringify(result)) {
            records[row.id] = result;
            changes.push({ id: row.id, at: nowIso(clock()), previous: prior, next: result });
          }
        }
        const next = { ...current.value, records, version: current.value.version + 1, updatedAt: nowIso(clock()),
          history: [...(current.value.history ?? []), ...changes] };
        if (Buffer.byteLength(JSON.stringify(next)) > 12_000_000) throw new HttpError(413, 'Historial demasiado grande; conserva un respaldo antes de continuar.');
        await store.write('data.json', next, current.etag);
        return send(res, 200, { ok: true, version: next.version, changed: changes.length });
      }
      throw new HttpError(404, 'No encontrado.');
    } catch (error) {
      if (error instanceof Conflict) return send(res, 409, { error: 'Otra solicitud actualizó los datos. Recarga e intenta de nuevo.' });
      return send(res, error.status ?? 503, { error: error.status ? error.message : 'Servicio privado temporalmente no disponible. Intenta nuevamente.' });
    }
  };
}

export default createHandler();
