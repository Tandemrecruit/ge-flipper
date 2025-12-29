/**
 * Suggestion Scoring Utility
 *
 * Computes a numeric score for flip suggestions based on multiple factors:
 * - Expected profitability (suggestedProfit, suggestedROI, estimatedProfitPerHour)
 * - Liquidity (daily volume, buy limit, estimated round-trip time)
 * - Risk controls (marginHealth, spread caps, manipulation flags)
 * - Freshness (age of price data)
 * - Volatility (price stability from history)
 */

// Weight configuration for scoring factors
const WEIGHTS = {
  profitability: 0.32,
  roi: 0.15,
  liquidity: 0.22,
  freshness: 0.11,
  volatility: 0.10,
  marginHealth: 0.10
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

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

  // 1) Profitability (0-100)
  // Prefer a conservative throughput-aware metric if available.
  const profitPerHourCeiling = options.profitPerHourCeiling || 500_000; // 500k gp/hr = "excellent" baseline
  const profitPerItemCeiling = options.profitCeiling || 10_000;         // 10k gp/item = excellent per-item

  if (typeof item.estimatedProfitPerHour === 'number' && Number.isFinite(item.estimatedProfitPerHour)) {
    breakdown.profitability = Math.min(100, (item.estimatedProfitPerHour / profitPerHourCeiling) * 100);
  } else {
    breakdown.profitability = Math.min(100, (item.suggestedProfit / profitPerItemCeiling) * 100);
  }

  // 2) ROI (0-100)
  const roiCeiling = options.roiCeiling || 10; // 10%+ ROI is excellent
  breakdown.roi = Math.min(100, (item.suggestedROI / roiCeiling) * 100);

  // 3) Liquidity (0-100)
  // Log-scale volume/limit so low-limit high-value items don't get nuked by tiers.
  const volume = Math.max(0, item.volume || 0);
  const buyLimit = Math.max(0, item.buyLimit || 0);

  const volScore = clamp((Math.log10(volume + 1) / 5) * 100, 0, 100);    // ~100 at 100k/day
  const limitScore = clamp((Math.log10(buyLimit + 1) / 3) * 100, 0, 100); // ~100 at 1k limit

  breakdown.liquidity = (volScore * 0.7) + (limitScore * 0.3);

  // Penalize very slow round-trips if we have an estimate
  if (typeof item.estimatedRoundTripMinutes === 'number' && Number.isFinite(item.estimatedRoundTripMinutes)) {
    const m = item.estimatedRoundTripMinutes;
    const speedFactor = m <= 60 ? 1 : m <= 240 ? 0.7 : m <= 720 ? 0.4 : 0.2;
    breakdown.liquidity = breakdown.liquidity * speedFactor;
  }

  // 4) Freshness (0-100)
  breakdown.freshness = item.freshnessStatus === 'fresh' ? 100 : item.freshnessStatus === 'stale' ? 20 : 60;

  // 5) Volatility (0-100): lower volatility = higher score
  if (volatilityData) {
    switch (volatilityData.volatilityStatus) {
      case 'low': breakdown.volatility = 100; break;
      case 'medium': breakdown.volatility = 70; break;
      case 'high': breakdown.volatility = 30; break;
      case 'extreme': breakdown.volatility = 0; break;
      default: breakdown.volatility = 55;
    }

    if (volatilityData.spreadStability === 'unstable') {
      breakdown.volatility = Math.max(0, breakdown.volatility - 20);
    } else if (volatilityData.spreadStability === 'variable') {
      breakdown.volatility = Math.max(0, breakdown.volatility - 10);
    }
  } else {
    // No history: use market pressure as a weak proxy
    breakdown.volatility = item.pressureStatus === 'balanced' ? 60 : item.pressureStatus === 'tilted' ? 45 : 35;
  }

  // 6) Margin health (0-100)
  switch (item.marginHealth) {
    case 'healthy': breakdown.marginHealth = 100; break;
    case 'thin': breakdown.marginHealth = 55; break;
    case 'risky': breakdown.marginHealth = 25; break;
    default: breakdown.marginHealth = 50;
  }

  let totalScore =
    breakdown.profitability * weights.profitability +
    breakdown.roi * weights.roi +
    breakdown.liquidity * weights.liquidity +
    breakdown.freshness * weights.freshness +
    breakdown.volatility * weights.volatility +
    breakdown.marginHealth * weights.marginHealth;

  // Pressure penalty (reduces false positives on one-sided books)
  if (item.pressureStatus === 'one-sided') totalScore -= 10;
  else if (item.pressureStatus === 'tilted') totalScore -= 5;

  // Manipulation penalty
  if (item.isManipulated) totalScore -= 20;

  totalScore = clamp(totalScore, 0, 100);

  let confidence;
  if (totalScore >= 75) confidence = 'high';
  else if (totalScore >= 50) confidence = 'medium';
  else confidence = 'low';

  // Overrides
  if (item.freshnessStatus === 'stale') confidence = 'low';
  if (volatilityData?.volatilityStatus === 'extreme') confidence = 'low';
  if (item.isManipulated) confidence = 'low';

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

  return items
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
      if (item.suggestionScore < minScore) return false;
      if (requireFresh && item.freshnessStatus === 'stale') return false;
      if (excludeHighVolatility && item.volatility?.volatilityStatus === 'extreme') return false;
      return true;
    })
    .sort((a, b) => b.suggestionScore - a.suggestionScore)
    .slice(0, maxResults);
};

/**
 * Generate a reason string based on item's top scoring factors
 *
 * @param {Object} item - Item with scoreBreakdown attached
 * @returns {string} Human-readable reason
 */
export const generateSuggestionReason = (item) => {
  if (!item.scoreBreakdown) return 'Good flip opportunity';

  const { profitability, roi, liquidity, freshness, volatility } = item.scoreBreakdown;

  const factors = [
    { name: 'profit', score: profitability, text: 'high expected profit' },
    { name: 'roi', score: roi, text: 'excellent ROI' },
    { name: 'liquidity', score: liquidity, text: 'good liquidity' },
    { name: 'freshness', score: freshness, text: 'fresh prices' },
    { name: 'volatility', score: volatility, text: 'stable prices' }
  ].sort((a, b) => b.score - a.score);

  const top = factors.slice(0, 2).filter(f => f.score >= 70);

  if (top.length >= 2) return `${capitalize(top[0].text)} with ${top[1].text}`;
  if (top.length === 1) return capitalize(top[0].text);

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
  if (!item.isSafeFlip) return false;
  if (item.suggestedProfit <= 0) return false;
  if (item.freshnessStatus === 'stale') return false;
  if (volatilityData?.volatilityStatus === 'extreme') return false;

  return true;
};
