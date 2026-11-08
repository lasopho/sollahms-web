export const PHONE = '+56 9 4850 2440';
export const WHATSAPP = 'https://wa.me/56948502440';

export function whatsappUrl(projectName) {
  const message = projectName
    ? `Hola, me interesa el proyecto ${projectName}. Quisiera recibir información sobre disponibilidad, precios y alternativas de compra.`
    : 'Hola, quisiera recibir asesoría inmobiliaria de Sollahms para encontrar una propiedad según mis necesidades.';
  return `${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

// Render real anchors so contact works on mobile, desktop and without JavaScript.
// Only the two official commercial numbers are eligible for replacement.
export function applyCommercialContact(html, projectName) {
  const url = whatsappUrl(projectName);
  html = html.replace(/href=(['"])tel:\+?56[\s-]*9[\s-]*(?:9625[\s-]*3757|4850[\s-]*2440)\1/gi,
    `href="${url}" aria-label="Consultar por WhatsApp a Sollahms"`);
  html = html.replace(/\+56\s*9\s*9625\s*3757/g, PHONE)
    .replace(/\+?56996253757/g, '+56948502440');
  const link = `<a data-sollahms-whatsapp href="${url}" aria-label="Consultar por WhatsApp a Sollahms" style="display:block;text-align:center;padding:12px 16px;">WhatsApp: ${PHONE}</a>`;
  if (html.includes('data-sollahms-whatsapp')) {
    html = html.replace(/<a\b[^>]*data-sollahms-whatsapp[^>]*>[\s\S]*?<\/a>/g, link);
  } else {
    html = html.replace(/(<footer\b[^>]*>)/i, '$1\n' + link);
  }
  return html;
}
