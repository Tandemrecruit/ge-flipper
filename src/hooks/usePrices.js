import { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { SAMPLE_MAPPING, SAMPLE_PRICES, SAMPLE_VOLUMES } from '../utils/constants';

// Helper to normalize API data into consistent { [stringId]: value } maps
const normalizeDataMap = (data, valueExtractor) => {
  const result = {};
  if (!data) return result;
  
  if (Array.isArray(data)) {
    for (const row of data) {
      if (row?.id != null) {
        const value = valueExtractor(row);
        if (value != null) result[String(row.id)] = value;
      }
    }
  } else if (typeof data === 'object') {
    for (const [id, v] of Object.entries(data)) {
      const value = valueExtractor(v, id);
      if (value != null) result[String(id)] = value;
    }
  }
  return result;
};

export const usePrices = (autoRefreshInterval = 60000) => {
  const [prices, setPrices] = useState({});
  const [volumes, setVolumes] = useState({});
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiSource, setApiSource] = useState('');
  const [volumeSource, setVolumeSource] = useState(''); // Track volume data source
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [volumesUpdatedAt, setVolumesUpdatedAt] = useState(null); // Track volume fetch time
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Fetch item mappings
  useEffect(() => {
    const loadMapping = async () => {
      const { data, source } = await fetchApi('mapping');
      if (data && Array.isArray(data)) {
        const map = {};
        data.forEach(item => {
          map[item.id] = item;
        });
        setMapping(map);
      } else {
        // Use sample mapping as fallback
        setMapping(SAMPLE_MAPPING);
      }
    };
    loadMapping();
  }, []);

  // Fetch prices
  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both latest (for instant buy/sell) and 5m averages (for realistic pricing)
      const [latestResult, avgResult] = await Promise.all([
        fetchApi('latest'),
        fetchApi('5m')
      ]);
      
      const priceData = latestResult.data;
      const avgData = avgResult.data;
      const priceSource = latestResult.source;
      
      if (!priceData || !priceData.data || Object.keys(priceData.data).length === 0) {
        throw new Error('No price data received');
      }
      
      // Merge 5m average data into prices for more realistic suggestions
      const mergedPrices = { ...priceData.data };
      if (avgData && avgData.data) {
        for (const [id, avgInfo] of Object.entries(avgData.data)) {
          if (mergedPrices[id]) {
            // Add 5m average prices to the price object
            mergedPrices[id] = {
              ...mergedPrices[id],
              avgHighPrice: avgInfo.avgHighPrice || null,
              avgLowPrice: avgInfo.avgLowPrice || null,
              highPriceVolume: avgInfo.highPriceVolume || 0,
              lowPriceVolume: avgInfo.lowPriceVolume || 0
            };
          }
        }
      }
      
      setPrices(mergedPrices);
      setLastUpdate(new Date());
      setUsingSampleData(false);
      setApiSource(priceSource);
      
    } catch (err) {
      console.error('Fetch error:', err);
      // Load sample data as fallback
      setPrices(SAMPLE_PRICES);
      setLastUpdate(new Date());
      setUsingSampleData(true);
      setApiSource('sample');
      setError('Using sample data - live API unavailable. Run the proxy (npm run proxy) for live prices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    if (!autoRefreshEnabled || autoRefreshInterval <= 0) return;
    
    const interval = setInterval(fetchPrices, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, autoRefreshEnabled]);

  // Fetch volumes - prefer true 24h /volumes endpoint, fallback to 5m estimation
  useEffect(() => {
    const loadVolumes = async () => {
      // Try fetching true 24h volumes first
      const volumesResult = await fetchApi('volumes');
      
      if (volumesResult.data && volumesResult.data.data) {
        // /volumes endpoint returns { data: { "itemId": dailyVolume, ... } }
        const volumeMap = normalizeDataMap(volumesResult.data.data, (v) => {
          // Value is the daily volume directly
          const vol = typeof v === 'number' ? v : (v?.volume ?? v?.dailyVolume ?? null);
          return vol > 0 ? vol : null;
        });
        
        if (Object.keys(volumeMap).length > 0) {
          setVolumes(volumeMap);
          setVolumeSource(volumesResult.source + ' (24h)');
          setVolumesUpdatedAt(new Date());
          return;
        }
      }
      
      // Fallback: estimate from 5m data (5m volume × 288 = approx daily)
      console.warn('24h volumes unavailable, falling back to 5m estimation');
      const fiveMinResult = await fetchApi('5m');
      
      if (fiveMinResult.data && fiveMinResult.data.data) {
        const volumeMap = normalizeDataMap(fiveMinResult.data.data, (v) => {
          const fiveMin = (v?.highPriceVolume ?? 0) + (v?.lowPriceVolume ?? 0) + (v?.volume ?? 0);
          return fiveMin > 0 ? fiveMin * 288 : null;
        });
        
        if (Object.keys(volumeMap).length > 0) {
          setVolumes(volumeMap);
          setVolumeSource(fiveMinResult.source + ' (5m est)');
          setVolumesUpdatedAt(new Date());
          return;
        }
      }
      
      // Final fallback: sample data
      setVolumes(SAMPLE_VOLUMES);
      setVolumeSource('sample');
      setVolumesUpdatedAt(new Date());
    };
    loadVolumes();
  }, []);

  return {
    prices,
    volumes,
    mapping,
    loading,
    apiSource,
    volumeSource,
    usingSampleData,
    error,
    lastUpdate,
    volumesUpdatedAt,
    refreshPrices: fetchPrices,
    autoRefreshEnabled,
    setAutoRefreshEnabled
  };
};
