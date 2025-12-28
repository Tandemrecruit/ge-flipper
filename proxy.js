const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3013;
const API_BASE = 'https://prices.runescape.wiki/api/v1/osrs';
const USER_AGENT = 'GE-Flipper-Dashboard/1.0 (Personal flipping tool)';

app.use(cors());

// Proxy endpoints
app.get('/api/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  const url = `${API_BASE}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\nðŸŽ® OSRS GE Proxy running on http://localhost:${PORT}`);
  console.log(`   Proxying requests to ${API_BASE}`);
  console.log(`   User-Agent: ${USER_AGENT}\n`);
});
