// Netlify Function - proxy simples para buscar M3U/Xtream sem bloqueio de CORS
exports.handler = async (event) => {
  const targetUrl = event.queryStringParameters && event.queryStringParameters.url;

  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Parâmetro "url" ausente.'
    };
  }

  try {
    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (IPTV Player Proxy)' }
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: `O servidor de origem respondeu com erro ${res.status}`
      };
    }

    const body = await res.text();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain; charset=utf-8'
      },
      body
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Falha ao buscar a URL de origem: ' + err.message
    };
  }
};
