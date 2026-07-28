'use strict';

const SITE_NAME = 'Diamantes Realty Group';
const DEFAULT_ORIGIN = 'https://www.diamantesrealtygroup.com';
const DEFAULT_IMAGE = `${DEFAULT_ORIGIN}/assets/logo.png`;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'inmo-nicaragua';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') return value;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in value) return decodeFirestoreFields(value.mapValue.fields || {});
  return '';
}

function decodeFirestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)]));
}

function plainText(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortDescription(value = '', maxLength = 200) {
  const text = plainText(value);
  if (text.length <= maxLength) return text;
  const candidate = text.slice(0, maxLength + 1);
  const lastSpace = candidate.lastIndexOf(' ');
  return `${candidate.slice(0, lastSpace >= 160 ? lastSpace : maxLength).trim()}…`;
}

function validHttpsImage(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function coverImage(property = {}) {
  const candidates = [
    property.coverImage,
    property.mainImage,
    property.featuredImage,
    property.imageUrl,
    ...(Array.isArray(property.images) ? property.images : []),
    ...(Array.isArray(property.imageUrls) ? property.imageUrls : []),
    ...(Array.isArray(property.imagenes) ? property.imagenes : []),
    property.image,
    property.imagen
  ];
  return candidates.map(validHttpsImage).find(Boolean) || DEFAULT_IMAGE;
}

function requestOrigin(req) {
  const configured = String(process.env.PUBLIC_SITE_ORIGIN || '').trim();
  if (configured) {
    try { return new URL(configured).origin; } catch { /* use request host */ }
  }
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return host ? `${proto}://${host}` : DEFAULT_ORIGIN;
}

function propertyIsPublic(property = {}) {
  const hasPublicationStatus = Object.hasOwn(property, 'publicationStatus');
  const hasPublicVisible = Object.hasOwn(property, 'publicVisible');
  return (property.publicationStatus === 'approved' && property.publicVisible === true)
    || (!hasPublicationStatus && !hasPublicVisible);
}

async function fetchProperty(propertyId) {
  const documentUrl = new URL(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/properties/${encodeURIComponent(propertyId)}`);
  const response = await fetch(documentUrl, { headers: { Accept: 'application/json' } });
  if (response.status === 404 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Firestore respondió ${response.status}`);
  const document = await response.json();
  const property = decodeFirestoreFields(document.fields || {});
  return propertyIsPublic(property) ? property : null;
}

function renderHtml({ property, propertyId, origin }) {
  const title = plainText(property.title || property.titulo) || 'Propiedad en Diamantes Realty Group';
  const description = shortDescription(property.description || property.descripcion)
    || 'Conoce esta propiedad disponible en Diamantes Realty Group.';
  const image = coverImage(property);
  const detailUrl = `${origin}/propiedad.html?id=${encodeURIComponent(propertyId)}`;
  const shareUrl = `${origin}/share/property/${encodeURIComponent(propertyId)}`;
  const safe = Object.fromEntries(Object.entries({ title, description, image, detailUrl, shareUrl }).map(([key, value]) => [key, escapeHtml(value)]));

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safe.title} | ${SITE_NAME}</title>
  <link rel="canonical" href="${safe.detailUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${safe.title}">
  <meta property="og:description" content="${safe.description}">
  <meta property="og:image" content="${safe.image}">
  <meta property="og:image:secure_url" content="${safe.image}">
  <meta property="og:image:alt" content="${safe.title}">
  <meta property="og:url" content="${safe.shareUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safe.title}">
  <meta name="twitter:description" content="${safe.description}">
  <meta name="twitter:image" content="${safe.image}">
  <meta http-equiv="refresh" content="0;url=${safe.detailUrl}">
</head>
<body>
  <p>Ver propiedad en <a href="${safe.detailUrl}">${SITE_NAME}</a>.</p>
</body>
</html>`;
}

async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).send('Método no permitido');
  }

  const propertyId = String(req.query.id || '').trim();
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(propertyId)) return res.status(400).send('ID de propiedad no válido');

  try {
    const property = await fetchProperty(propertyId);
    if (!property) return res.status(404).send('Propiedad no encontrada');
    const html = renderHtml({ property, propertyId, origin: requestOrigin(req) });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(req.method === 'HEAD' ? '' : html);
  } catch (error) {
    console.error('[PropertyShare] No se pudo generar la vista previa:', error);
    return res.status(502).send('No se pudo cargar la propiedad');
  }
}

handler._test = { coverImage, decodeFirestoreFields, escapeHtml, renderHtml, shortDescription };
module.exports = handler;
