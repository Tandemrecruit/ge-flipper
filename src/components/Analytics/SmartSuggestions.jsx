import React, { useMemo } from 'react';
import { useItems } from '../../hooks/useItems';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import { formatNumber } from '../../utils/formatters';
import { computeSuggestionScore, isEligibleForSuggestion, generateSuggestionReason } from '../../utils/suggestions';

export default function SmartSuggestions({ prices, volumes, mapping, flipLog, itemAnalytics, onTrackFlip, onAssignToSlot }) {
  const { getVolatility, getPriceTrend } = usePriceHistory(prices, mapping, flipLog);
  
  // Add null checks to prevent crashes
  if (!prices || !volumes || !mapping) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 20 }}>
          🤖 Smart Suggestions
        </h3>
        <p style={{ color: '#d4a84b', fontSize: 13 }}>
          Loading price data...
        </p>
      </div>
    );
  }

  const { items } = useItems(prices, volumes, mapping);

  const suggestions = useMemo(() => {
    try {
      if (!items || !Array.isArray(items)) {
        return [];
      }

      // Helper: Check if item has acceptable freshness for suggestions
      const hasFreshData = (item) => {
        return item.freshnessStatus === 'fresh' || item.freshnessStatus === 'ok';
      };
      
      // Helper: Get volatility data for an item
      const getItemVolatility = (item) => {
        return getVolatility(String(item.id), 7);
      };
      
      // Helper: Check if item has acceptable volatility
      const hasAcceptableVolatility = (item) => {
        const vol = getItemVolatility(item);
        // Accept unknown (no history yet), low, or medium volatility
        // Reject high and extreme volatility
        return vol.volatilityStatus === 'unknown' || 
               vol.volatilityStatus === 'low' || 
               vol.volatilityStatus === 'medium';
      };
      
      // Helper: Get trend for an item
      const getItemTrend = (item) => {
        return getPriceTrend(String(item.id), 7);
      };
      
      // Helper: Downgrade confidence based on freshness and volatility
      const adjustConfidence = (baseConfidence, item) => {
        let confidence = baseConfidence;
        
        // Downgrade for staleness
        if (item.freshnessStatus === 'stale') confidence = 'low';
        else if (item.freshnessStatus === 'ok' && confidence === 'high') confidence = 'medium';
        
        // Downgrade for volatility
        const vol = getItemVolatility(item);
        if (vol.volatilityStatus === 'high' && confidence === 'high') confidence = 'medium';
        if (vol.volatilityStatus === 'extreme') confidence = 'low';
        
        // Downgrade for unstable spreads
        if (vol.spreadStability === 'unstable' && confidence === 'high') confidence = 'medium';
        
        return confidence;
      };

      const completedFlips = flipLog.filter(f => f.status === 'complete');
    
    if (completedFlips.length < 3) {
      // Not enough data for smart suggestions, return top items by EXPECTED profit
      return items
        .filter(item => item.isSafeFlip && item.suggestedProfit > 0 && hasFreshData(item) && hasAcceptableVolatility(item))
        .sort((a, b) => b.suggestedProfit - a.suggestedProfit)
        .slice(0, 10)
        .map(item => ({
          ...item,
          reason: 'High expected profit margin',
          confidence: adjustConfidence('medium', item),
          volatility: getItemVolatility(item),
          trend: getItemTrend(item)
        }));
    }

    // Analyze successful patterns
    const successfulItems = (itemAnalytics || [])
      .filter(item => item.flips >= 2 && item.winRate >= 60 && item.totalProfit > 0)
      .sort((a, b) => b.winRate - a.winRate);

    // Find similar items to successful ones
    const suggestions = [];

    // 1. Similar items to your best performers
    successfulItems.slice(0, 5).forEach(successfulItem => {
      const similarItems = items
        .filter(item => {
          // Similar price range (within 50% of successful item's avg buy price)
          if (!successfulItem.avgBuyPrice || successfulItem.avgBuyPrice === 0) return false;
          const priceDiff = Math.abs(item.buyPrice - successfulItem.avgBuyPrice) / successfulItem.avgBuyPrice;
          // Similar volume tier
          const volumeMatch = 
            (successfulItem.totalQuantity > 10000 && item.isVeryHighVolume) ||
            (successfulItem.totalQuantity > 1000 && item.isHighVolume) ||
            (successfulItem.totalQuantity <= 1000 && !item.isVeryHighVolume && !item.isHighVolume);
          
          // Require fresh data, positive expected profit, and acceptable volatility
          return priceDiff < 0.5 && volumeMatch && item.isSafeFlip && item.suggestedProfit > 0 && hasFreshData(item) && hasAcceptableVolatility(item);
        })
        .sort((a, b) => b.suggestedProfit - a.suggestedProfit)
        .slice(0, 3)
        .map(item => ({
          ...item,
          reason: `Similar to ${successfulItem.name} (${successfulItem.winRate.toFixed(0)}% win rate)`,
          confidence: adjustConfidence('high', item),
          volatility: getItemVolatility(item),
          trend: getItemTrend(item)
        }));

      suggestions.push(...similarItems);
    });

    // 2. Items you've never flipped but match your successful patterns
    const flippedItemIds = new Set((flipLog || []).map(f => f.itemId).filter(Boolean));
    const newItems = items
      .filter(item => {
        if (flippedItemIds.has(item.id)) return false;
        if (!item.isSafeFlip || item.suggestedProfit <= 0) return false;
        if (!hasFreshData(item)) return false;
        if (!hasAcceptableVolatility(item)) return false;
        
        // Match successful patterns: good spread, high volume
        const hasGoodSpread = item.spreadPercent >= 3;
        const hasGoodVolume = item.isHighVolume || item.isVeryHighVolume;
        
        return hasGoodSpread && hasGoodVolume;
      })
      .sort((a, b) => b.suggestedProfit - a.suggestedProfit)
      .slice(0, 5)
      .map(item => ({
        ...item,
        reason: 'Matches your successful patterns',
        confidence: adjustConfidence('medium', item),
        volatility: getItemVolatility(item),
        trend: getItemTrend(item)
      }));

    suggestions.push(...newItems);

    // 3. Items with improving trends - prioritize items with good current spreads, fresh data, AND stable prices
    const trendingItems = items
      .filter(item => {
        if (flippedItemIds.has(item.id)) return false;
        if (!item.isSafeFlip || item.suggestedProfit <= 0) return false;
        if (!hasFreshData(item)) return false;
        if (!hasAcceptableVolatility(item)) return false;
        
        // Prefer stable trends for flipping (avoid buying into momentum)
        const trend = getItemTrend(item);
        if (trend === 'up') return false; // Skip items trending up (buying into momentum)
        
        return item.spreadPercent >= 4 && item.isVeryHighVolume;
      })
      .sort((a, b) => b.suggestedProfit - a.suggestedProfit)
      .slice(0, 3)
      .map(item => ({
        ...item,
        reason: 'High spread with stable prices',
        confidence: adjustConfidence('high', item),
        volatility: getItemVolatility(item),
        trend: getItemTrend(item)
      }));

    suggestions.push(...trendingItems);

    // Remove duplicates and compute scores for each suggestion
    const unique = new Map();
    suggestions.forEach(suggestion => {
      const key = suggestion.id;
      if (!unique.has(key) || unique.get(key).confidence === 'low') {
        // Compute suggestion score using the scoring module
        const volatilityData = getItemVolatility(suggestion);
        const { score, breakdown, confidence: computedConfidence } = computeSuggestionScore(
          suggestion, 
          volatilityData
        );
        
        // Use the computed confidence if it's lower than the category-based confidence
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        const finalConfidence = confidenceOrder[computedConfidence] < confidenceOrder[suggestion.confidence]
          ? computedConfidence
          : suggestion.confidence;
        
        unique.set(key, {
          ...suggestion,
          suggestionScore: score,
          scoreBreakdown: breakdown,
          confidence: finalConfidence
        });
      }
    });

    // Sort by suggestion score (primary) and expected profit (secondary)
    return Array.from(unique.values())
      .sort((a, b) => {
        // First sort by score
        if (a.suggestionScore !== b.suggestionScore) {
          return b.suggestionScore - a.suggestionScore;
        }
        // Then by confidence
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        }
        // Finally by expected profit
        return b.suggestedProfit - a.suggestedProfit;
      })
      .slice(0, 10);
    } catch (error) {
      console.error('SmartSuggestions error:', error);
      return [];
    }
  }, [items, itemAnalytics, flipLog, getVolatility, getPriceTrend]);

  const formatCurrency = (value) => {
    return formatNumber(value);
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return '#4caf50';
      case 'medium': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  if (suggestions.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
        No suggestions available. Complete more flips to get personalized recommendations!
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 20 }}>
        🤖 Smart Suggestions
      </h3>
      <p style={{ color: '#d4a84b', fontSize: 13, marginBottom: 16 }}>
        Based on your flip history and successful patterns
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {suggestions.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              backgroundColor: '#1a1611',
              border: '1px solid #3a3429',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <img 
                  src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon?.replace(/ /g, '_') || item.name.replace(/ /g, '_'))}.png`}
                  alt={item.name}
                  style={{ width: 32, height: 32, objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <div style={{ color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>
                    {item.name}
                  </div>
                  <div style={{ 
                    color: getConfidenceColor(item.confidence), 
                    fontSize: 12,
                    marginTop: 4
                  }}>
                    {item.reason}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {item.suggestionScore !== undefined && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#d4a84b', fontSize: 11 }}>Score</div>
                  <div style={{ 
                    color: item.suggestionScore >= 70 ? '#4caf50' : item.suggestionScore >= 45 ? '#ff9800' : '#f44336', 
                    fontSize: 16, 
                    fontWeight: 600 
                  }}>
                    {item.suggestionScore}
                  </div>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#d4a84b', fontSize: 11 }}>Expected Profit</div>
                <div style={{ color: '#4caf50', fontSize: 16, fontWeight: 600 }}>
                  {formatCurrency(item.suggestedProfit)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#d4a84b', fontSize: 11 }}>Instant Profit</div>
                <div style={{ color: '#8bc34a', fontSize: 14 }}>
                  {formatCurrency(item.netProfit)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#d4a84b', fontSize: 11 }}>Spread</div>
                <div style={{ color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>
                  {item.spreadPercent.toFixed(2)}%
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {onTrackFlip && (
                  <button
                    className="btn"
                    onClick={() => onTrackFlip(item)}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    Track
                  </button>
                )}
                {onAssignToSlot && (
                  <button
                    className="btn"
                    onClick={() => onAssignToSlot(null, item)}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    Add to Slot
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
