// /api/enviroflash?type=forecast|realtime&id=25 (Cleveland-Akron-Lorain) or 24 (Cincinnati)
// Proxies NOACA/EnviroFlash RSS server-side so the browser never has to fetch
// feeds.enviroflash.info directly (that server sends no CORS headers).
export default async function handler(req, res) {
  const { type, id } = req.query;
  if (!type || !id || !['forecast', 'realtime'].includes(type)) {
    return res.status(400).json({ error: "Missing or invalid 'type' (forecast|realtime) or 'id'" });
  }
  try {
    const target = `https://feeds.enviroflash.info/rss/${type}/${id}.xml`;
    const r = await fetch(target);
    if (!r.ok) {
      return res.status(r.status).json({ error: `EnviroFlash returned ${r.status}` });
    }
    const text = await r.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300'); // 10 min cache, be polite to NOACA
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
