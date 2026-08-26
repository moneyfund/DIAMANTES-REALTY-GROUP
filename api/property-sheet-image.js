const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12000;

function isAllowedImageHost(hostname = '') {
  const host = String(hostname || '').toLowerCase();
  return host === 'firebasestorage.googleapis.com'
    || host === 'storage.googleapis.com'
    || host === 'googleusercontent.com'
    || host.endsWith('.googleusercontent.com');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const rawUrl = Array.isArray(req.query?.url) ? req.query.url[0] : req.query?.url;
  let imageUrl;

  try {
    imageUrl = new URL(String(rawUrl || ''));
  } catch {
    return res.status(400).json({ error: 'URL de imagen inválida' });
  }

  if (imageUrl.protocol !== 'https:' || !isAllowedImageHost(imageUrl.hostname)) {
    return res.status(403).json({ error: 'Origen de imagen no permitido' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(imageUrl.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'DiamantesRealtyGroup-PropertySheet/1.0'
      }
    });

    if (!upstream.ok) {
      const status = upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502;
      return res.status(status).json({ error: 'No fue posible obtener la imagen' });
    }

    const contentType = String(upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      return res.status(415).json({ error: 'El recurso no es una imagen' });
    }

    const contentLength = Number(upstream.headers.get('content-length') || 0);
    if (contentLength > MAX_IMAGE_BYTES) {
      return res.status(413).json({ error: 'La imagen supera el tamaño permitido' });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return res.status(413).json({ error: 'La imagen supera el tamaño permitido' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'La imagen tardó demasiado en responder' });
    }

    console.error('[PropertySheetImageProxy] Error:', error);
    return res.status(502).json({ error: 'No fue posible procesar la imagen' });
  } finally {
    clearTimeout(timeout);
  }
}
