// Proxy URL from environment variable, with fallback for development
const getProxyUrl = () => {
  if (import.meta.env.VITE_PROXY_URL) {
    return import.meta.env.VITE_PROXY_URL;
  }
  // Default to localhost for development only
  if (import.meta.env.DEV) {
    return 'http://localhost:3013/api';
  }
  // Production requires VITE_PROXY_URL to be set
  return null;
};

export const PROXY_URL = getProxyUrl();
export const DIRECT_API = 'https://prices.runescape.wiki/api/v1/osrs';

// Fetch API with proxy-first strategy
// Production: proxy only (ensures User-Agent is set)
// Development: proxy first, fallback to direct API
export const fetchApi = async (endpoint) => {
  const isProduction = import.meta.env.PROD;
  
  // Try proxy first (required in production)
  if (PROXY_URL) {
    try {
      const proxyRes = await fetch(`${PROXY_URL}/${endpoint}`, { signal: AbortSignal.timeout(3000) });
      if (proxyRes.ok) {
        return { data: await proxyRes.json(), source: 'proxy' };
      }
    } catch (e) {
      // Proxy not available
      if (isProduction) {
        // In production, proxy is required - fail if unavailable
        console.error('Proxy unavailable in production. VITE_PROXY_URL must be configured.');
        return { data: null, source: 'failed' };
      }
      // In development, continue to direct API fallback
    }
  } else if (isProduction) {
    // Production without proxy URL configured
    console.error('VITE_PROXY_URL must be set in production builds');
    return { data: null, source: 'failed' };
  }
  
  // Development fallback: try direct API (browsers can't set User-Agent, but may work for CORS)
  if (!isProduction) {
    try {
      const directRes = await fetch(`${DIRECT_API}/${endpoint}`, { mode: 'cors', signal: AbortSignal.timeout(10000) });
      if (directRes.ok) {
        return { data: await directRes.json(), source: 'direct' };
      }
    } catch (e) {
      // Direct failed too
    }
  }
  
  return { data: null, source: 'failed' };
};
