// api/rxterms.js
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const terms = (req.query?.terms || '').toString().trim();
  if (!terms) {
    return res.status(200).json({ total: 0, items: [] });
  }

  try {
    const url = new URL('https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search');
    url.searchParams.set('terms', terms);
    url.searchParams.set('ef', 'STRENGTHS_AND_FORMS,RXCUIS,DISPLAY_NAME_SYNONYM');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      return res.status(502).json({ error: `NIH API ${response.status}` });
    }

    const data = await response.json();

    const total = Number(data?.[0]) || 0;
    const displayArr = Array.isArray(data?.[3]) ? data[3] : (Array.isArray(data?.[1]) ? data[1] : []);
    const extras = (data?.[2] && typeof data[2] === 'object') ? data[2] : {};

    const strengthsList = Array.isArray(extras['STRENGTHS_AND_FORMS']) ? extras['STRENGTHS_AND_FORMS'] : [];
    const rxcuisList = Array.isArray(extras['RXCUIS']) ? extras['RXCUIS'] : [];

    const items = Array.isArray(displayArr)
      ? displayArr.map((disp, i) => ({
          displayName: Array.isArray(disp) ? (disp[0] ?? '') : (disp ?? ''),
          strengths: Array.isArray(strengthsList?.[i]) ? strengthsList[i] : [],
          rxcuisByIndex: Array.isArray(rxcuisList?.[i]) ? rxcuisList[i] : []
        }))
      : [];

    return res.status(200).json({ total, items });
  } catch (error) {
    console.error('rxterms error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
};
