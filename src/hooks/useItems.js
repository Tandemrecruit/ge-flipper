import { useMemo } from 'react';
import { calculateTax } from '../utils/calculations';
import { POPULAR_ITEMS } from '../utils/constants';

export const useItems = (prices, volumes, mapping, filters) => {
  const {
    showSafeOnly = true,
    minProfit = 1000,
    minRoi = 1,
    searchTerm = '',
    availableGold = '',
    sortBy = 'profit',
    sortAsc = false
  } = filters || {};

  // Process items for flipping
  const flipItems = useMemo(() => {
    const items = [];
    
    // Handle missing data gracefully
    if (!prices || !mapping || typeof prices !== 'object') {
      return items;
    }
    
    Object.entries(prices).forEach(([id, priceData]) => {
      const itemInfo = mapping[id];
      if (!itemInfo) return;
      
      const { high, low, highTime, lowTime, avgHighPrice, avgLowPrice } = priceData;
      if (!high || !low || high <= low) return;
      
      // CRITICAL: Use actual BUY and SELL prices for profit calculation, not offer/list prices
      // In OSRS GE API, 'high' and 'low' represent actual transaction prices:
      // - low = lowest sell offer = what you PAY when instant buying (BUY price)
      // - high = highest buy offer = what you RECEIVE when instant selling (SELL price)
      // These are the actual transaction prices, not current offer/list prices
      // Using correct break-even math:
      // Tax = 2% of sell price, capped at 5M
      // Net proceeds = S - tax
      // Profit = Net proceeds - B
      // Break-even requires ~2.04% spread (for items under 250M)
      const buyPrice = low;  // Actual BUY price (what you pay when buying)
      const sellPrice = high; // Actual SELL price (what you receive when selling)
      const tax = calculateTax(sellPrice); // 2% capped at 5M
      const netProceeds = sellPrice - tax;
      const netProfit = netProceeds - buyPrice;
      const grossMargin = sellPrice - buyPrice;
      
      // ROI based on actual profit vs investment
      const roi = ((netProfit / buyPrice) * 100);
      
      // Spread percentage (gross margin / buy price)
      const spreadPercent = ((sellPrice - buyPrice) / buyPrice) * 100;
      
      if (netProfit <= 0) return;
      
      // Use 5m averages for more realistic suggested prices (if available)
      // These represent where trades are ACTUALLY happening, not outliers
      let suggestedBuy, suggestedSell;
      
      if (avgLowPrice && avgHighPrice && avgHighPrice > avgLowPrice) {
        // Use 5m averages - much more realistic
        const avgSpread = avgHighPrice - avgLowPrice;
        // For small spreads (< 4 GP), don't adjust - use raw avg prices
        if (avgSpread < 4) {
          suggestedBuy = avgLowPrice;
          suggestedSell = avgHighPrice;
        } else {
          suggestedBuy = Math.ceil(avgLowPrice + avgSpread * 0.15);  // Slightly above avg low
          suggestedSell = Math.floor(avgHighPrice - avgSpread * 0.15); // Slightly below avg high
        }
      } else {
        // Fallback to instant prices
        // For small spreads (< 4 GP), don't adjust inward - just use raw prices
        // This prevents the "buy high, sell low" bug on cheap items
        if (grossMargin < 4) {
          suggestedBuy = low;
          suggestedSell = high;
        } else {
          // For larger spreads, adjust inward by 3% but never more than 25% of the spread
          const maxAdjustment = Math.floor(grossMargin * 0.25);
          const adjustment = Math.min(maxAdjustment, Math.max(1, Math.floor(grossMargin * 0.03)));
          suggestedBuy = low + adjustment;
          suggestedSell = high - adjustment;
        }
      }
      
      // Final safety check - if prices would cross or be equal, use raw prices
      if (suggestedSell <= suggestedBuy) {
        suggestedBuy = low;
        suggestedSell = high;
      }
      
      const suggestedTax = calculateTax(suggestedSell);
      const suggestedProfit = suggestedSell - suggestedTax - suggestedBuy;
      
      // CRITICAL: Skip items where suggested profit is zero or negative
      // This prevents recommending losing trades
      if (suggestedProfit <= 0) return;
      
      // Volume data (use string key for consistency)
      const volume = (volumes && (volumes[String(id)] || volumes[id])) || 0;
      
      // Buy limit from mapping
      const buyLimit = itemInfo.limit || 0;
      
      // STALENESS DETECTION - compute how old the price data is
      const now = Date.now();
      const highTimeMs = highTime ? highTime * 1000 : null;
      const lowTimeMs = lowTime ? lowTime * 1000 : null;
      
      // Use the oldest of the two timestamps (most stale)
      const oldestUpdate = Math.min(
        highTimeMs || now,
        lowTimeMs || now
      );
      const stalenessMinutes = (now - oldestUpdate) / (1000 * 60);
      
      // Freshness classification based on volume tier
      // High volume items can tolerate more staleness, slow items need fresh data
      const getFreshnessStatus = (staleMinutes, isHighVol, isVeryHighVol) => {
        if (isVeryHighVol) {
          // Very active items: fresh if < 30min, stale if > 60min
          if (staleMinutes < 30) return 'fresh';
          if (staleMinutes < 60) return 'ok';
          return 'stale';
        } else if (isHighVol) {
          // Active items: fresh if < 15min, stale if > 30min
          if (staleMinutes < 15) return 'fresh';
          if (staleMinutes < 30) return 'ok';
          return 'stale';
        } else {
          // Slow items: need very fresh data
          if (staleMinutes < 10) return 'fresh';
          if (staleMinutes < 20) return 'ok';
          return 'stale';
        }
      };
      
      // MANIPULATION DETECTION - filter out fake/stale price items
      // Now also considers extreme staleness as a manipulation signal
      const isManipulated = spreadPercent > 50 || (volume === 0 && spreadPercent > 10) || (volume < 10 && spreadPercent > 25);
      if (isManipulated) return;
      
      // Volume thresholds - MUST factor in buy limit
      const hasGoodBuyLimit = buyLimit >= 100;
      const hasGreatBuyLimit = buyLimit >= 1000;
      
      // Market activity thresholds (daily volume estimates)
      const marketIsActive = buyPrice < 100000 ? volume > 10000 : volume > 100;
      const marketIsVeryActive = buyPrice < 100000 ? volume > 50000 : volume > 500;
      
      // Combined: both market activity AND buy limit must be good
      const isHighVolume = hasGoodBuyLimit && marketIsActive;
      const isVeryHighVolume = hasGreatBuyLimit && marketIsVeryActive;
      
      // Safe flip criteria
      const minSpreadRequired = isVeryHighVolume ? 2.5 : (isHighVolume ? 3.5 : 4.5);
      const meetsMarginThreshold = spreadPercent >= minSpreadRequired;
      
      // Margin health: how much buffer above break-even (2.04%)
      const marginBuffer = spreadPercent - 2.04;
      const marginHealth = marginBuffer >= 2 ? 'healthy' : (marginBuffer >= 0.5 ? 'thin' : 'risky');
      
      // Safe flip requires: good volume, good buy limit, good margin, not suspiciously wide
      const isSafeFlip = isHighVolume && meetsMarginThreshold && spreadPercent < 15;
      
      // Compute freshness status (needs volume tiers first)
      const freshnessStatus = getFreshnessStatus(stalenessMinutes, isHighVolume, isVeryHighVolume);
      
      // Compute suggested ROI (based on expected fill prices, not instant)
      const suggestedROI = suggestedBuy > 0 ? ((suggestedProfit / suggestedBuy) * 100) : 0;
      
      items.push({
        id: parseInt(id),
        name: itemInfo.name,
        icon: itemInfo.icon,
        buyLimit,
        members: itemInfo.members,
        highAlch: itemInfo.highalch,
        buyPrice,
        sellPrice,
        avgBuyPrice: avgLowPrice || null,
        avgSellPrice: avgHighPrice || null,
        tax,
        grossMargin,
        netProfit,
        netProceeds,
        roi,
        suggestedBuy,
        suggestedSell,
        suggestedProfit,
        suggestedROI,
        highTime: highTime ? new Date(highTime * 1000) : null,
        lowTime: lowTime ? new Date(lowTime * 1000) : null,
        stalenessMinutes,
        freshnessStatus,
        isPopular: POPULAR_ITEMS[id] !== undefined,
        volume,
        isHighVolume,
        isVeryHighVolume,
        isSafeFlip,
        spreadPercent,
        marginBuffer,
        marginHealth,
        minSpreadRequired
      });
    });
    
    return items;
  }, [prices, mapping, volumes]);

  // Filter and sort
  const displayItems = useMemo(() => {
    const searchLower = searchTerm?.toLowerCase().trim() || '';
    const hasActiveSearch = searchLower.length >= 2; // Consider it an active search if 2+ chars
    
    let filtered = flipItems.filter(item => {
      const matchesSearch = !searchLower || item.name.toLowerCase().includes(searchLower);
      
      // If user is actively searching, bypass "Safe Flips Only" for matching items
      // This ensures users can always find items they're looking for by name
      if (hasActiveSearch && matchesSearch) {
        // Still apply profit/roi filters but skip the safe-only filter
        if (item.netProfit < minProfit) return false;
        if (item.roi < minRoi) return false;
        if (availableGold && item.buyPrice > parseFloat(availableGold)) return false;
        return true;
      }
      
      // Normal filtering when not actively searching
      if (showSafeOnly && !item.isSafeFlip) return false;
      if (item.netProfit < minProfit) return false;
      if (item.roi < minRoi) return false;
      if (!matchesSearch) return false;
      if (availableGold && item.buyPrice > parseFloat(availableGold)) return false;
      return true;
    });
    
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
    
    return filtered;
  }, [flipItems, minProfit, minRoi, searchTerm, sortBy, sortAsc, availableGold, showSafeOnly]);

  return {
    items: flipItems,
    filteredItems: displayItems
  };
};
