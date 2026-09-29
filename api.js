export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Supports both ?name= or ?game_query=
    const gameName = url.searchParams.get('name') || url.searchParams.get('game_query');

    if (!gameName) {
      return new Response(JSON.stringify({ error: 'Missing game query parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const SGDB_API_KEY = env.SGDB_API_KEY; // Stored securely in Cloudflare Environment Variables

    try {
      // 1. Search for game ID on SteamGridDB
      const searchRes = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`, {
        headers: { 'Authorization': `Bearer ${SGDB_API_KEY}` }
      });
      const searchData = await searchRes.json();
      
      if (!searchData.data || searchData.data.length === 0) {
        return new Response(JSON.stringify({ cover: null, hero: null, logo: null }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      const gameId = searchData.data[0].id;

      // 2. Fetch grids, heroes, and logos concurrently
      const [gridsRes, heroesRes, logosRes] = await Promise.all([
        fetch(`https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900`, { headers: { 'Authorization': `Bearer ${SGDB_API_KEY}` } }),
        fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${gameId}`, { headers: { 'Authorization': `Bearer ${SGDB_API_KEY}` } }),
        fetch(`https://www.steamgriddb.com/api/v2/logos/game/${gameId}`, { headers: { 'Authorization': `Bearer ${SGDB_API_KEY}` } })
      ]);

      const [gridsData, heroesData, logosData] = await Promise.all([
        gridsRes.json(),
        heroesRes.json(),
        logosRes.json()
      ]);

      const result = {
        cover: gridsData.data?.[0]?.url || null,
        hero: heroesData.data?.[0]?.url || null,
        logo: logosData.data?.[0]?.url || null
      };

      // Return JSON with CORS headers enabled so your app can call it freely
      return new Response(JSON.stringify(result), {
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400' // Cache results on Cloudflare for 24 hours
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Failed to fetch art' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
