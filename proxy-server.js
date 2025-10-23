// proxy-server.js
// Run this with: node proxy-server.js
// Then update your web app to use http://localhost:3001 instead of direct API calls

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

// Enable CORS for your React dev server
app.use(cors());
app.use(express.json());

// RxTerms search endpoint
app.get('/api/rxterms/search', async (req, res) => {
  try {
    const { terms } = req.query;
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
    console.error('RxTerms search error:', error.message);
    res.status(500).json({ error: 'Failed to search drug database' });
  }
});

// RxNav approximate match endpoint
app.get('/api/rxnav/approxMatch', async (req, res) => {
  try {
    const { term } = req.query;
    const { data } = await axios.get(
      'https://rxnav.nlm.nih.gov/REST/approximateTerm.json',
      { params: { term, maxEntries: 5 } }
    );
    res.json(data);
  } catch (error) {
    console.error('RxNav approxMatch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from RxNav' });
  }
});

// RxNav properties endpoint
app.get('/api/rxnav/props', async (req, res) => {
  try {
    const { rxcui } = req.query;
    const { data } = await axios.get(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allProperties.json`,
      { params: { prop: 'all' } }
    );
    res.json(data);
  } catch (error) {
    console.error('RxNav props error:', error.message);
    res.status(500).json({ error: 'Failed to fetch properties from RxNav' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running on http://localhost:${PORT}`);
  console.log(`   Web app can now access NIH APIs through this proxy`);
});