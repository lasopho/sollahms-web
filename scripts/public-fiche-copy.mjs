// Presentation-only policy. Original captions, hashes and evidence stay private.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const policy = JSON.parse(await readFile(new URL('../data/public-caption-policy.json', import.meta.url)));
const apply = (value, rules) => rules.reduce((text, rule) => text.replace(new RegExp(rule.pattern, 'gi'), rule.replacement), value);
export const naturalCaption = value => apply(String(value), policy.captionRules).replace(/\s{2,}/g, ' ').trim();
const tagPattern = /(<(?:[^>"']|"[^"]*"|'[^']*')+>)/g;
export function normalizeFicheCopy(source) {
  if (/\bid=["']informacion-inmobiliaria-material-grafico["']/i.test(source)) return source;
  const body = /<body\b[^>]*>/i.exec(source);
  if (!body) return source;
  const bodyStart = body.index + body[0].length;
  let prefix = source.slice(0, bodyStart);
  // Social image descriptions are presentation; SEO identities/URLs stay exact.
  prefix = prefix.replace(/(<meta\b[^>]*property="og:image:alt"[^>]*content=")([^"]*)(")/gi,
    (_, a, caption, end) => a + naturalCaption(caption) + end);
  const tokens = source.slice(bodyStart).split(tagPattern);
  let protectedTag = null, captionDepth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('<')) {
      if (/^<(script|style)\b/i.test(token)) protectedTag = /^<(script|style)/i.exec(token)[1].toLowerCase();
      else if (protectedTag && new RegExp('^</' + protectedTag + '\\b', 'i').test(token)) protectedTag = null;
      else if (!protectedTag) {
        if (/^<figcaption\b/i.test(token)) captionDepth++;
        if (/^<\/figcaption\b/i.test(token)) captionDepth--;
        tokens[i] = token.replace(/\b(alt|aria-label|data-embed-title)=(["'])(.*?)(\2)/gi,
          (_, key, quote, caption, end) => key + '=' + quote + naturalCaption(caption) + end);
      }
    } else if (!protectedTag) {
      tokens[i] = captionDepth > 0 ? naturalCaption(token) : apply(token, policy.textRules);
    }
  }
  return prefix + tokens.join('');
}
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes('--stdin')) {
  process.stdin.setEncoding('utf8');
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  process.stdout.write(normalizeFicheCopy(input));
}
