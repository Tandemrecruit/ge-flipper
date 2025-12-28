# GE Flipper - OSRS Grand Exchange Dashboard

A real-time flipping dashboard for Old School RuneScape with tax calculations, volume analysis, and comprehensive flip tracking.

## Features

- 🔍 **Live prices** from OSRS Wiki API (with local proxy for reliability)
- 💰 **2% GE tax** calculations (capped at 5M)
- 📊 **Slot allocation** strategy (5 liquid / 2 medium / 1 opportunity)
- 📈 **Flip tracker** with expected vs actual profit
- 🛡️ **Safe flip filtering** based on volume tiers
- 💾 **Local storage** persistence for tracked flips and slots
- 📉 **Analytics dashboard** with ROI tracking and profit timelines
- 🎯 **Smart suggestions** based on historical performance

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Quick Start

```bash
# Install dependencies
npm install

# Run both proxy and dashboard
npm start
```

This starts:
- **Proxy** on `http://localhost:3013` (adds proper headers for Wiki API)
- **Dashboard** on `http://localhost:5173` (auto-opens in browser)

## Alternative Commands

```bash
# Run only the dashboard (uses direct API, may hit CORS)
npm run dev

# Run only the proxy
npm run proxy

# Build for production
npm run build
```

## How It Works

### Proxy (Port 3013)
The OSRS Wiki API recommends identifying your application via User-Agent headers. Browsers can't reliably set these, so the proxy:
1. Receives requests from the dashboard
2. Forwards them to `prices.runescape.wiki/api/v1/osrs`
3. Adds proper `User-Agent` identification
4. Returns the response with CORS headers

### Dashboard
The dashboard tries the proxy first (fast 3s timeout), then falls back to direct API calls if the proxy isn't running. If both fail, it loads sample data so you can still explore the UI.

## Data Sources

- **Prices**: `/latest` endpoint - current high/low instant buy/sell prices
- **Volumes**: `/volumes` endpoint - daily trade volumes
- **Mapping**: `/mapping` endpoint - item names, icons, buy limits

## Tax Calculation

```
Tax = 2% of sell price (capped at 5,000,000 gp)
Net Profit = Sell Price - Tax - Buy Price
Break-even spread ≈ 2.04%
```

## Safe Flip Rules

| Volume Tier | Items/Day | Required Spread |
|-------------|-----------|-----------------|
| ⚡ Fast | 50K+ (consumables) / 500+ (gear) | 2.5%+ |
| 💧 Liquid | 10K+ (consumables) / 100+ (gear) | 3.5%+ |
| 🐌 Slow | Below thresholds | 4.5%+ |

Items must also have <15% spread (avoids manipulated items).

## Slot Strategy

| Slot Type | Count | Purpose |
|-----------|-------|---------|
| 💎 Liquid Staple | 5 | Fast fills, smaller margins |
| 🎯 Medium Margin | 2 | Slower, higher profit per slot |
| 🎲 Opportunity | 1 | Open for deals or emergency cash |

## Project Structure

```
ge-flipper/
├── package.json          # Scripts and dependencies
├── proxy.js              # Express proxy server (port 3013)
├── vite.config.js        # Vite configuration
├── index.html            # HTML entry point
└── src/
    ├── main.jsx          # React entry point
    ├── App.jsx           # Main dashboard component
    ├── components/       # React components
    │   ├── Analytics/    # Analytics and ROI components
    │   ├── Finder/       # Item finder and filters
    │   ├── Layout/       # Header, footer, tabs
    │   ├── Settings/     # Settings components
    │   ├── Slots/        # Slot allocation components
    │   └── Tracker/      # Flip tracking components
    ├── hooks/            # Custom React hooks
    ├── utils/            # Utility functions
    └── styles/           # Global styles and theme
```

## Troubleshooting

**"Using sample data" warning**
- Run `npm start` to start the proxy
- Or `npm run proxy` in a separate terminal

**Proxy won't start**
- Check if port 3013 is in use: `lsof -i :3013` (Linux/Mac) or `netstat -ano | findstr :3013` (Windows)
- Change port in `proxy.js` and `src/utils/api.js` (PROXY_URL)

**CORS errors without proxy**
- This is expected - the Wiki API doesn't support browser CORS
- Use the proxy or accept sample data in the browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Credits

- Price data: [OSRS Wiki Real-Time Prices API](https://oldschool.runescape.wiki/w/RuneScape:Real-time_Prices)
- Built with React + Vite
