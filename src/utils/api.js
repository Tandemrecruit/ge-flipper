export const PROXY_URL = 'http://localhost:3013/api';
export const DIRECT_API = 'https://prices.runescape.wiki/api/v1/osrs';

// Try proxy first, fallback to direct API
export const fetchApi = async (endpoint) => {
  // Try proxy first
  try {
    const proxyRes = await fetch(`${PROXY_URL}/${endpoint}`, { signal: AbortSignal.timeout(3000) });
    if (proxyRes.ok) {
      return { data: await proxyRes.json(), source: 'proxy' };
    }
  } catch (e) {
    // Proxy not available, try direct
  }
  
  // Try direct API
  try {
    const directRes = await fetch(`${DIRECT_API}/${endpoint}`, { mode: 'cors', signal: AbortSignal.timeout(10000) });
    if (directRes.ok) {
      return { data: await directRes.json(), source: 'direct' };
    }
  } catch (e) {
    // Direct failed too
  }
  
  return { data: null, source: 'failed' };
};
