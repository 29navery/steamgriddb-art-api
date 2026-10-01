export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get('endpoint'); 

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const targetUrl = `https://www.steamgriddb.com/api/v2/${endpoint}`;
    const response = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${env.SGDB_API_KEY}`
      }
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
