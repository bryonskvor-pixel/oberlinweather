// /api/hms-smoke?date=YYYYMMDD (defaults to today, UTC)
// Proxies NOAA/NESDIS HMS smoke polygon GeoJSON server-side so the browser never
// has to fetch satepsanone.nesdis.noaa.gov directly (that server sends no CORS headers).
export default async function handler(req, res) {
  try {
    const dateStr = (req.query.date || new Date().toISOString().slice(0, 10).replace(/-/g, ''));
    if (!/^\d{8}$/.test(dateStr)) {
      return res.status(400).json({ error: "date must be YYYYMMDD" });
    }
    const y = dateStr.slice(0, 4);
    const mo = dateStr.slice(4, 6);
    const target = `https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Smoke_Polygons/GeoJSON/${y}/${mo}/hms_smoke${dateStr}.json`;
    const r = await fetch(target);
    if (!r.ok) {
      return res.status(r.status).json({ error: `HMS unavailable for ${dateStr}` });
    }
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=900'); // 30 min cache
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
