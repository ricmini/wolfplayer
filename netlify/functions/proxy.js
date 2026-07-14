// Netlify Function - proxy para M3U/Xtream E para segmentos de vídeo (texto ou binário)
exports.handler = async (event) => {
  const targetUrl = event.queryStringParameters && event.queryStringParameters.url;
  const customUa = event.queryStringParameters && event.queryStringParameters.ua;
  const userAgent = customUa && customUa.trim() ? customUa.trim() : 'VLC/3.0.18 LibVLC/3.0.18';

  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Parâmetro "url" ausente.'
    };
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': userAgent }
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: `O servidor de origem respondeu com erro ${res.status}`
      };
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Playlists m3u8 são texto; segmentos .ts/.aac/etc são binário — decide como devolver
    const isText = contentType.includes('mpegurl') || contentType.includes('text') || contentType.includes('json') || targetUrl.includes('.m3u8');

    if (isText && !contentType.includes('json')) {
      let text = buffer.toString('utf-8');
      // Reescreve URLs relativas/absolutas dentro do m3u8 para passarem pelo mesmo proxy
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const selfBase = `/.netlify/functions/proxy?ua=${encodeURIComponent(userAgent)}&url=`;
      text = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        let absolute = trimmed;
        if (!/^https?:\/\//i.test(trimmed)) {
          absolute = new URL(trimmed, baseUrl).toString();
        }
        return selfBase + encodeURIComponent(absolute);
      }).join('\n');

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8'
        },
        body: text
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Falha ao buscar a URL de origem: ' + err.message
    };
  }
};
