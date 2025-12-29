import { useState, useEffect, useMemo } from 'react';

// Store price history in localStorage
const STORAGE_KEY = 'ge-price-history';
const MAX_HISTORY_DAYS = 30; // Keep 30 days of history

// Configurable volatility thresholds
const VOLATILITY_THRESHOLDS = {
  low: 2,      // < 2% coefficient of variation is low volatility
  medium: 5,   // 2-5% is medium
  high: 10     // 5-10% is high, > 10% is extreme
};

// Spread stability thresholds (coefficient of variation %)
const SPREAD_STABILITY_THRESHOLDS = {
  stable: 25,   // CV < 25% is stable
  variable: 50  // 25-50% is variable, > 50% is unstable
};

// Recommended refresh intervals based on volatility (in milliseconds)
const UPDATE_INTERVALS = {
  extreme: 30000,   // 30 seconds for extreme volatility
  high: 60000,      // 1 minute for high volatility
  medium: 120000,   // 2 minutes for medium
  low: 300000       // 5 minutes for low/unknown
};

// IQR-based outlier detection and coefficient of variation calculation
const calculateCVWithOutliers = (values) => {
  if (values.length < 2) return { cv: null, outlierCount: 0, filtered: values };

  // Sort values for IQR calculation
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  // Filter outliers (values outside 1.5 * IQR from quartiles)
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const filtered = values.filter(v => v >= lowerBound && v <= upperBound);
  const outlierCount = values.length - filtered.length;

  if (filtered.length < 2) {
    return { cv: null, outlierCount, filtered: values };
  }

  // Calculate coefficient of variation on filtered data
  const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
  const variance = filtered.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / filtered.length;
  const cv = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

  return { cv, outlierCount, filtered };
};

export const usePriceHistory = (prices, mapping, flipLog = [], slots = [], currentItemId = null) => {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Compute watchlist from flipLog, slots, and currentItemId
  const watchlist = useMemo(() => {
    const watchlistSet = new Set();
    
    // Add items from tracked flips
    if (flipLog && Array.isArray(flipLog)) {
      flipLog.forEach(flip => {
        if (flip.itemId) {
          watchlistSet.add(String(flip.itemId));
        }
      });
    }
    
    // Add items from slots
    if (slots && Array.isArray(slots)) {
      slots.forEach(slot => {
        if (slot.item && slot.item.id) {
          watchlistSet.add(String(slot.item.id));
        }
      });
    }
    
    // Add currently viewed item
    if (currentItemId) {
      watchlistSet.add(String(currentItemId));
    }
    
    return watchlistSet;
  }, [flipLog, slots, currentItemId]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save price history:', err);
    }
  }, [history]);

  // Clean up history for items not in watchlist
  useEffect(() => {
    setHistory(prev => {
      const updated = { ...prev };
      let hasChanges = false;
      
      // Remove history for items not in watchlist
      Object.keys(updated).forEach(itemId => {
        if (!watchlist.has(itemId)) {
          delete updated[itemId];
          hasChanges = true;
        }
      });
      
      return hasChanges ? updated : prev;
    });
  }, [watchlist]);

  // Update history when prices change (only for watchlist items)
  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;
    if (watchlist.size === 0) return; // No items to track

    const now = new Date();
    const timestamp = now.toISOString();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    setHistory(prev => {
      const updated = { ...prev };
      
      // Only process items in the watchlist
      Object.entries(prices).forEach(([itemId, priceData]) => {
        if (!watchlist.has(itemId)) return; // Skip items not in watchlist
        
        if (!updated[itemId]) {
          updated[itemId] = [];
        }

        const itemHistory = updated[itemId];
        const latest = itemHistory[itemHistory.length - 1];
        
        // Only add if price changed or it's been more than 5 minutes
        const shouldAdd = !latest || 
          latest.high !== priceData.high || 
          latest.low !== priceData.low ||
          (new Date(timestamp) - new Date(latest.timestamp)) > 5 * 60 * 1000;

        if (shouldAdd) {
          itemHistory.push({
            timestamp,
            dateKey,
            high: priceData.high,
            low: priceData.low,
            highTime: priceData.highTime,
            lowTime: priceData.lowTime
          });

          // Clean up old entries (keep only last MAX_HISTORY_DAYS days)
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
          updated[itemId] = itemHistory.filter(
            entry => new Date(entry.timestamp) >= cutoffDate
          );
        }
      });

      return updated;
    });
  }, [prices, watchlist]);

  // Get price history for a specific item
  const getItemHistory = (itemId, days = 7) => {
    if (!history[itemId]) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return history[itemId].filter(
      entry => new Date(entry.timestamp) >= cutoffDate
    );
  };

  // Get daily aggregated history
  const getDailyHistory = (itemId, days = 7) => {
    const itemHistory = getItemHistory(itemId, days);
    if (itemHistory.length === 0) return [];

    const dailyMap = {};
    
    itemHistory.forEach(entry => {
      const dateKey = entry.dateKey;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          highs: [],
          lows: [],
          timestamps: []
        };
      }
      dailyMap[dateKey].highs.push(entry.high);
      dailyMap[dateKey].lows.push(entry.low);
      dailyMap[dateKey].timestamps.push(entry.timestamp);
    });

    return Object.values(dailyMap)
      .map(day => ({
        date: day.date,
        high: Math.max(...day.highs),
        low: Math.min(...day.lows),
        avgHigh: day.highs.reduce((a, b) => a + b, 0) / day.highs.length,
        avgLow: day.lows.reduce((a, b) => a + b, 0) / day.lows.length,
        count: day.highs.length
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Get price trend (up, down, stable)
  const getPriceTrend = (itemId, days = 7) => {
    const daily = getDailyHistory(itemId, days);
    if (daily.length < 2) return 'stable';

    const recent = daily.slice(-3);
    const older = daily.slice(0, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, d) => sum + d.avgHigh, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.avgHigh, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 2) return 'up';
    if (change < -2) return 'down';
    return 'stable';
  };

  // Compute volatility metrics for an item
  // Returns { volatilityPercent, volatilityStatus, spreadStability, recommendedInterval, outlierCount }
  const getVolatility = (itemId, days = 7) => {
    const daily = getDailyHistory(itemId, days);

    // Not enough data - assume unknown/medium volatility
    if (daily.length < 2) {
      return {
        volatilityPercent: null,
        volatilityStatus: 'unknown',
        spreadStability: 'unknown',
        dataPoints: 0,
        recommendedInterval: UPDATE_INTERVALS.low,
        outlierCount: 0
      };
    }

    // Extract high and low prices
    const highs = daily.map(d => d.avgHigh).filter(h => h > 0);
    const lows = daily.map(d => d.avgLow).filter(l => l > 0);

    if (highs.length < 2 || lows.length < 2) {
      return {
        volatilityPercent: null,
        volatilityStatus: 'unknown',
        spreadStability: 'unknown',
        dataPoints: daily.length,
        recommendedInterval: UPDATE_INTERVALS.low,
        outlierCount: 0
      };
    }

    // Calculate CV with outlier detection for both highs AND lows
    const highStats = calculateCVWithOutliers(highs);
    const lowStats = calculateCVWithOutliers(lows);

    // Use the higher CV (more conservative - reflects greater volatility)
    const volatilityPercent = Math.max(highStats.cv || 0, lowStats.cv || 0);
    const totalOutlierCount = highStats.outlierCount + lowStats.outlierCount;

    // Compute spread stability (how consistent is the high-low spread)
    // Use daily entries directly to ensure high/low pairs correspond to the same day
    const spreads = daily
      .filter(d => d.avgHigh > 0 && d.avgLow > 0)
      .map(d => ((d.avgHigh - d.avgLow) / d.avgLow) * 100)
      .filter(s => s > 0);

    let spreadStability = 'stable';
    if (spreads.length >= 2) {
      const spreadStats = calculateCVWithOutliers(spreads);
      const spreadCV = spreadStats.cv || 0;

      // Use configurable thresholds
      if (spreadCV > SPREAD_STABILITY_THRESHOLDS.variable) spreadStability = 'unstable';
      else if (spreadCV > SPREAD_STABILITY_THRESHOLDS.stable) spreadStability = 'variable';
    }

    // Classify volatility status using configurable thresholds
    let volatilityStatus;
    if (volatilityPercent < VOLATILITY_THRESHOLDS.low) volatilityStatus = 'low';
    else if (volatilityPercent < VOLATILITY_THRESHOLDS.medium) volatilityStatus = 'medium';
    else if (volatilityPercent < VOLATILITY_THRESHOLDS.high) volatilityStatus = 'high';
    else volatilityStatus = 'extreme';

    // Determine recommended update interval based on volatility
    const recommendedInterval = UPDATE_INTERVALS[volatilityStatus] || UPDATE_INTERVALS.low;

    return {
      volatilityPercent,
      volatilityStatus,
      spreadStability,
      dataPoints: daily.length,
      recommendedInterval,
      outlierCount: totalOutlierCount
    };
  };

  // Batch compute volatility for multiple items (for efficiency)
  const getVolatilityBatch = useMemo(() => {
    return (itemIds, days = 7) => {
      const result = {};
      for (const id of itemIds) {
        result[id] = getVolatility(id, days);
      }
      return result;
    };
  }, [history]);

  return {
    history,
    getItemHistory,
    getDailyHistory,
    getPriceTrend,
    getVolatility,
    getVolatilityBatch
  };
};
