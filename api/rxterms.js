import axios from 'axios';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { terms } = req.query;
  
  try {
    const { data } = await axios.get(
      'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search',
      {
        params: {
          terms,
          ef: 'STRENGTHS_AND_FORMS,RXCUIS,DISPLAY_NAME_SYNONYM'
        },
        timeout: 8000
      }
    );

    const total = data?.[0];
    const displayArr = data?.[3];
    const extras = data?.[2];

    if (!displayArr || !extras) {
      return res.json({ total: 0, items: [] });
    }

    const strengthsList = extras['STRENGTHS_AND_FORMS'] ?? [];
    const rxcuisList = extras['RXCUIS'] ?? [];

    const normalized = displayArr.map((disp, i) => ({
      displayName: disp?.[0],
      strengths: strengthsList?.[i] ?? [],
      rxcuisByIndex: rxcuisList?.[i] ?? []
    }));

    res.json({ total, items: normalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}