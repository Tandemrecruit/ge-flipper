/**
 * Suggestion Scoring Utility
 * 
 * Computes a numeric score for flip suggestions based on multiple factors:
 * - Expected profitability (suggestedProfit, suggestedROI)
 * - Liquidity (volume, buyLimit, volume tiers)
 * - Risk controls (marginHealth, spread cap, manipulation flags)
 * - Freshness (age of price data)
 * - Volatility (price stability from history)
 */

// Weight configuration for scoring factors
const WEIGHTS = {
  profitability: 0.30,   // Expected profit matters most
  roi: 0.15,             // ROI efficiency
  liquidity: 0.20,       // Volume and buy limit
  freshness: 0.15,       // Data freshness
  volatility: 0.10,      // Price stability
  marginHealth: 0.10     // Spread buffer above break-even
};

/**
 * Compute a normalized score (0-100) for a flip suggestion
 * 
 * @param {Object} item - Item from useItems with all computed fields
 * @param {Object} volatilityData - Volatility data from usePriceHistory.getVolatility()
 * @param {Object} options - Optional overrides for scoring weights
 * @returns {Object} { score, breakdown, confidence }
 */
export const computeSuggestionScore = (item, volatilityData = null, options = {}) => {
  const weights = { ...WEIGHTS, ...options.weights };
  
  const breakdown = {
    profitability: 0,
    roi: 0,
    liquidity: 0,
    freshness: 0,
    volatility: 0,
    marginHealth: 0
  };
  
  // 1. Profitability score (0-100)
  // Normalize suggestedProfit - assume 10k+ gp per item is excellent
  const profitCeiling = options.profitCeiling || 10000;
  breakdown.profitability = Math.min(100, (item.suggestedProfit / profitCeiling) * 100);
  
  // 2. ROI score (0-100)
  // Normalize suggestedROI - assume 10%+ ROI is excellent
  const roiCeiling = options.roiCeiling || 10;
  breakdown.roi = Math.min(100, (item.suggestedROI / roiCeiling) * 100);
  
  // 3. Liquidity score (0-100)
  // Based on volume tier and buy limit
  if (item.isVeryHighVolume) {
    breakdown.liquidity = 100;
  } else if (item.isHighVolume) {
    breakdown.liquidity = 70;
  } else if (item.volume > 0 && item.buyLimit >= 50) {
    breakdown.liquidity = 40;
  } else {
    breakdown.liquidity = 10;
  }
  
  // 4. Freshness score (0-100)
  // Based on staleness and freshness status
  switch (item.freshnessStatus) {
    case 'fresh':
      breakdown.freshness = 100;
      break;
    case 'ok':
      breakdown.freshness = 60;
      break;
    case 'stale':
      breakdown.freshness = 20;
      break;
    default:
      breakdown.freshness = 50; // Unknown
  }
  
  // 5. Volatility score (0-100) - lower volatility = higher score
  if (volatilityData) {
    switch (volatilityData.volatilityStatus) {
      case 'low':
        breakdown.volatility = 100;
        break;
      case 'medium':
        breakdown.volatility = 70;
        break;
      case 'high':
        breakdown.volatility = 30;
        break;
      case 'extreme':
        breakdown.volatility = 0;
        break;
      default:
        breakdown.volatility = 50; // Unknown
    }
    
    // Penalize unstable spreads
    if (volatilityData.spreadStability === 'unstable') {
      breakdown.volatility = Math.max(0, breakdown.volatility - 20);
    } else if (volatilityData.spreadStability === 'variable') {
      breakdown.volatility = Math.max(0, breakdown.volatility - 10);
    }
  } else {
    breakdown.volatility = 50; // No data
  }
  
  // 6. Margin health score (0-100)
  switch (item.marginHealth) {
    case 'healthy':
      breakdown.marginHealth = 100;
      break;
    case 'thin':
      breakdown.marginHealth = 50;
      break;
    case 'risky':
      breakdown.marginHealth = 20;
      break;
    default:
      breakdown.marginHealth = 50;
  }
  
  // Compute weighted total score
  const totalScore = 
    breakdown.profitability * weights.profitability +
    breakdown.roi * weights.roi +
    breakdown.liquidity * weights.liquidity +
    breakdown.freshness * weights.freshness +
    breakdown.volatility * weights.volatility +
    breakdown.marginHealth * weights.marginHealth;
  
  // Determine confidence level based on score thresholds
  let confidence;
  if (totalScore >= 70) {
    confidence = 'high';
  } else if (totalScore >= 45) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // Apply penalties that can override confidence
  if (item.freshnessStatus === 'stale') confidence = 'low';
  if (volatilityData?.volatilityStatus === 'extreme') confidence = 'low';
  
  return {
    score: Math.round(totalScore),
    breakdown,
    confidence
  };
};

/**
 * Score and rank a list of items for suggestions
 * 
 * @param {Array} items - Array of items from useItems
 * @param {Function} getVolatility - Function to get volatility for an item
 * @param {Object} options - Scoring options
 * @returns {Array} Sorted array with scores attached
 */
export const rankSuggestions = (items, getVolatility, options = {}) => {
  const {
    minScore = 30,
    maxResults = 10,
    requireFresh = true,
    excludeHighVolatility = true
  } = options;
  
  const scored = items
    .map(item => {
      const volatilityData = getVolatility ? getVolatility(String(item.id), 7) : null;
      const { score, breakdown, confidence } = computeSuggestionScore(item, volatilityData, options);
      
      return {
        ...item,
        suggestionScore: score,
        scoreBreakdown: breakdown,
        computedConfidence: confidence,
        volatility: volatilityData
      };
    })
    .filter(item => {
      // Apply filters
      if (item.suggestionScore < minScore) return false;
      if (requireFresh && item.freshnessStatus === 'stale') return false;
      if (excludeHighVolatility && item.volatility?.volatilityStatus === 'extreme') return false;
      return true;
    })
    .sort((a, b) => b.suggestionScore - a.suggestionScore)
    .slice(0, maxResults);
  
  return scored;
};

/**
 * Generate a reason string based on item's top scoring factors
 * 
 * @param {Object} item - Item with scoreBreakdown attached
 * @returns {string} Human-readable reason
 */
export const generateSuggestionReason = (item) => {
  if (!item.scoreBreakdown) {
    return 'Good flip opportunity';
  }
  
  const { profitability, roi, liquidity, freshness, volatility } = item.scoreBreakdown;
  
  // Find top 2 factors
  const factors = [
    { name: 'profit', score: profitability, text: 'high expected profit' },
    { name: 'roi', score: roi, text: 'excellent ROI' },
    { name: 'liquidity', score: liquidity, text: 'great liquidity' },
    { name: 'freshness', score: freshness, text: 'fresh prices' },
    { name: 'volatility', score: volatility, text: 'stable prices' }
  ].sort((a, b) => b.score - a.score);
  
  const top = factors.slice(0, 2).filter(f => f.score >= 70);
  
  if (top.length >= 2) {
    return `${capitalize(top[0].text)} with ${top[1].text}`;
  } else if (top.length === 1) {
    return capitalize(top[0].text);
  }
  
  return 'Good flip opportunity';
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Check if an item passes basic suggestion eligibility
 * 
 * @param {Object} item - Item from useItems
 * @param {Object} volatilityData - Optional volatility data
 * @returns {boolean}
 */
export const isEligibleForSuggestion = (item, volatilityData = null) => {
  // Must be safe flip with positive expected profit
  if (!item.isSafeFlip) return false;
  if (item.suggestedProfit <= 0) return false;
  
  // Must have fresh enough data
  if (item.freshnessStatus === 'stale') return false;
  
  // Must not be extremely volatile
  if (volatilityData?.volatilityStatus === 'extreme') return false;
  
  return true;
};
