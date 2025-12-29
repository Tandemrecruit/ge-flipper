import { useMemo } from 'react';
import { calculateTax } from '../utils/calculations';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const parseGold = (raw) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const useItems = (prices, volumes, mapping, filters = {}) => {
  const {
    minProfit = 0,
    minRoi = 0,
    searchTerm = '',
    sortBy = 'suggestedProfit',
    sortAsc = false,
    availableGold = '',
    showSafeOnly = false
  } = filters;

  const parsedGold = parseGold(availableGold);

  const items = useMemo(() => {
    if (!prices || !mapping) return [];

    return Object.entries(prices)
      .map(([itemId, priceData]) => {
        const itemInfo = mapping[itemId];
        if (!itemInfo) return null;

        // Prices Wiki semantics:
        // - low  = last instant sell transaction (rough bid)
        // - high = last instant buy transaction (rough ask)
        const bidInstant = priceData?.low;
        const askInstant = priceData?.high;

        if (!bidInstant || !askInstant || askInstant <= bidInstant) return null;

        const avgBid = priceData?.avgLowPrice || null;     // 5m avg bid proxy
        const avgAsk = priceData?.avgHighPrice || null;    // 5m avg ask proxy

        const bid = avgBid && avgBid > 0 ? avgBid : bidInstant;
        const ask = avgAsk && avgAsk > 0 ? avgAsk : askInstant;

        if (!bid || !ask || ask <= bid) return null;

        const volume = volumes[itemId] || 0; // daily volume from /volumes when available
        const buyLimit = itemInfo.limit || 0;

        // Spread (instant) and % (instant)
        const spread = askInstant - bidInstant;
        const spreadPercent = (spread / bidInstant) * 100;

        // Spread (avg) and % (avg)
        const avgSpread = ask - bid;
        const avgSpreadPercent = (avgSpread / bid) * 100;

        // Recent activity / pressure signal from 5m endpoint merge (if present)
        const highPriceVolume5m = priceData?.highPriceVolume || 0;
        const lowPriceVolume5m = priceData?.lowPriceVolume || 0;
        const fiveMinVolume = highPriceVolume5m + lowPriceVolume5m;
        const pressure = fiveMinVolume > 0 ? (highPriceVolume5m - lowPriceVolume5m) / fiveMinVolume : 0; // [-1, 1]
        const pressureAbs = Math.abs(pressure);

        // Micro trend proxy: 5m avg vs 1h avg (if present)
        const avgBid1h = priceData?.avgLowPrice1h || null;
        const avgAsk1h = priceData?.avgHighPrice1h || null;
        const microTrendPct = (avgAsk1h && avgAsk1h > 0)
          ? ((ask - avgAsk1h) / avgAsk1h) * 100
          : null;

        // Tax and instant profit (idealized)
        const tax = calculateTax(askInstant);
        const netProceeds = askInstant - tax;
        const netProfit = netProceeds - bidInstant;
        const roi = (netProfit / bidInstant) * 100;

        // --- Suggested offer model (more conservative, volume/pressure-aware) ---
        const isHighValueTier = buyLimit > 0 && buyLimit < 100 && bid >= 1_000_000 && volume >= 20;

        const liquidityTier = isHighValueTier
          ? 'highValue'
          : (volume >= 50_000 && buyLimit >= 1_000 ? 'fast'
            : (volume >= 10_000 && buyLimit >= 100 ? 'liquid'
              : (volume >= 2_000 ? 'medium' : 'slow')));

        const baseInwardPct =
          liquidityTier === 'fast' ? 0.08 :
          liquidityTier === 'liquid' ? 0.12 :
          liquidityTier === 'medium' ? 0.18 :
          liquidityTier === 'highValue' ? 0.20 :
          0.25;

        // More one-sided pressure or low 5m activity -> step further inside the spread (reduces false positives)
        const pressureBump = pressureAbs >= 0.50 ? 0.05 : (pressureAbs >= 0.25 ? 0.03 : 0);
        const lowActivityBump = fiveMinVolume > 0 && fiveMinVolume < 10 ? 0.04 : (fiveMinVolume === 0 && volume < 1_000 ? 0.05 : 0);
        const inwardPct = clamp(baseInwardPct + pressureBump + lowActivityBump, 0.05, 0.35);

        let suggestedBuy = bid;
        let suggestedSell = ask;

        if (avgSpread >= 3) {
          const step = Math.max(1, Math.round(avgSpread * inwardPct));
          suggestedBuy = bid + step;
          suggestedSell = ask - step;

          if (suggestedBuy >= suggestedSell) {
            // Fallback for tight spreads
            suggestedBuy = bid + 1;
            suggestedSell = ask - 1;
          }

          if (suggestedBuy >= suggestedSell) {
            suggestedBuy = bid;
            suggestedSell = ask;
          }
        }

        // Bound suggested prices to avoid crossing the avg spread
        suggestedBuy = Math.min(suggestedBuy, ask - 1);
        suggestedSell = Math.max(suggestedSell, suggestedBuy + 1);

        const suggestedTax = calculateTax(suggestedSell);
        const suggestedNetProceeds = suggestedSell - suggestedTax;
        const suggestedProfit = suggestedNetProceeds - suggestedBuy;
        const suggestedROI = (suggestedProfit / suggestedBuy) * 100;

        // A small buffer to account for tick/slippage realities (esp. when pressure is one-sided)
        const slippageBufferGp = Math.max(10, Math.floor(suggestedBuy * 0.001)); // ~0.1%
        const edgeProfit = suggestedProfit - slippageBufferGp;

        // Staleness (minutes since last high/low update)
        const now = Date.now();
        const highTime = priceData?.highTime ? priceData.highTime * 1000 : null;
        const lowTime = priceData?.lowTime ? priceData.lowTime * 1000 : null;
        const oldestTime = (highTime && lowTime) ? Math.min(highTime, lowTime) : (highTime || lowTime);
        const stalenessMinutes = oldestTime ? (now - oldestTime) / 1000 / 60 : Infinity;

        // Activity & manipulation heuristics
        const marketIsActive = (fiveMinVolume >= 10) || ((bid < 100_000) ? (volume > 5_000) : (volume > 30));

        const avgHighDevPct = (avgAsk && avgAsk > 0) ? Math.abs(askInstant - avgAsk) / avgAsk * 100 : 0;
        const avgLowDevPct = (avgBid && avgBid > 0) ? Math.abs(bidInstant - avgBid) / avgBid * 100 : 0;
        const avgDeviationPct = Math.max(avgHighDevPct, avgLowDevPct);

        const isSuspiciousSpread = spreadPercent > 50 || (spreadPercent > 25 && volume < 1_000);
        const isOneSidedPressure = pressureAbs >= 0.80 && fiveMinVolume < 50;
        const isOutlierMove = avgDeviationPct > 6 && volume < 2_000 && fiveMinVolume < 50;
        const isIlliquidBigSpread = volume < 10 && spread > 25;
        const isVeryLowVolBigSpread = volume === 0 && spread > 10;

        const isManipulated = isSuspiciousSpread || isOneSidedPressure || isOutlierMove || isIlliquidBigSpread || isVeryLowVolBigSpread;

        // Liquidity labels (used elsewhere)
        const isVeryHighVolume = volume >= 100_000;
        const isHighVolume = volume >= 20_000;

        const stalenessThreshold =
          liquidityTier === 'fast' ? 15 :
          liquidityTier === 'liquid' ? 20 :
          liquidityTier === 'medium' ? 30 :
          liquidityTier === 'highValue' ? 45 :
          45;

        const freshnessStatus = stalenessMinutes <= stalenessThreshold ? 'fresh' : 'stale';

        // Minimum ROI after our conservative suggested prices
        const minRoiRequired =
          liquidityTier === 'fast' ? 2.6 :
          liquidityTier === 'liquid' ? 3.2 :
          liquidityTier === 'highValue' ? 2.8 :
          liquidityTier === 'medium' ? 4.0 :
          5.0;

        const spreadCap = liquidityTier === 'slow' ? 25 : 15;

        const isSafeFlip =
          marketIsActive &&
          !isManipulated &&
          freshnessStatus === 'fresh' &&
          suggestedProfit > 0 &&
          edgeProfit > 0 &&
          suggestedROI >= minRoiRequired &&
          avgSpreadPercent < spreadCap;

        const marginHealth =
          suggestedROI >= 5 ? 'healthy' :
          suggestedROI >= 3 ? 'thin' :
          'risky';

        const pressureStatus =
          pressureAbs >= 0.50 ? 'one-sided' :
          pressureAbs >= 0.25 ? 'tilted' :
          'balanced';

        // Recommended qty (conservative): capped by buy limit, ~1% of daily volume, and (optionally) cash/diversification
        const marketQtyCap = volume > 0 ? Math.max(1, Math.floor(volume * 0.01)) : (buyLimit || 1);
        const defaultQtyCap = buyLimit > 0 ? Math.min(buyLimit, marketQtyCap) : marketQtyCap;

        let recommendedQty = defaultQtyCap;
        if (parsedGold) {
          const maxAffordable = Math.floor(parsedGold / suggestedBuy);
          const diversifyCap = Math.floor((parsedGold * 0.3) / suggestedBuy);
          recommendedQty = Math.min(recommendedQty, maxAffordable, diversifyCap);
        }
        recommendedQty = Math.max(1, recommendedQty);

        const estimatedTotalCost = recommendedQty * suggestedBuy;
        const estimatedTotalProfit = recommendedQty * suggestedProfit;

        // Rough round-trip time estimate based on daily volume (very conservative, assumes ~50/50 split buy vs sell)
        const estimatedRoundTripMinutes = volume > 0
          ? Math.max(5, (recommendedQty * 5760) / volume)
          : null;

        const estimatedProfitPerHour = estimatedRoundTripMinutes
          ? (estimatedTotalProfit / (estimatedRoundTripMinutes / 60))
          : null;

        return {
          id: parseInt(itemId, 10),
          name: itemInfo.name,
          icon: itemInfo.icon,
          limit: buyLimit,
          buyLimit,

          // Instant bid/ask
          buyPrice: bidInstant,
          sellPrice: askInstant,

          // Avg bid/ask (5m)
          avgBuyPrice: bid,
          avgSellPrice: ask,

          spread,
          spreadPercent,
          avgSpread,
          avgSpreadPercent,

          volume,
          isHighVolume,
          isVeryHighVolume,

          tax,
          netProfit,
          roi,

          // Suggested offers / expectations
          suggestedBuy,
          suggestedSell,
          suggestedTax,
          suggestedProfit,
          suggestedROI,
          slippageBufferGp,
          edgeProfit,

          // Signals
          fiveMinVolume,
          pressure,
          pressureStatus,
          microTrendPct,

          // Risk / tags
          liquidityTier,
          isSafeFlip,
          isManipulated,
          marketIsActive,
          freshnessStatus,
          stalenessMinutes,
          marginHealth,

          // Capacity estimates
          recommendedQty,
          estimatedTotalCost,
          estimatedTotalProfit,
          estimatedRoundTripMinutes,
          estimatedProfitPerHour
        };
      })
      .filter(Boolean);
  }, [prices, volumes, mapping, parsedGold]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return items
      .filter(item => {
        if (showSafeOnly && !item.isSafeFlip) return false;

        if (minProfit && item.suggestedProfit < minProfit) return false;
        if (minRoi && item.suggestedROI < minRoi) return false;

        if (term && !item.name.toLowerCase().includes(term)) return false;

        if (parsedGold != null && item.suggestedBuy > parsedGold) return false;

        return true;
      })
      .sort((a, b) => {
        const field = (sortBy && a[sortBy] !== undefined && b[sortBy] !== undefined)
          ? sortBy
          : 'suggestedProfit';

        const aVal = a[field];
        const bVal = b[field];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const cmp = aVal.localeCompare(bVal);
          return sortAsc ? cmp : -cmp;
        }

        const numA = typeof aVal === 'number' ? aVal : Number(aVal);
        const numB = typeof bVal === 'number' ? bVal : Number(bVal);

        const cmp = (numA || 0) - (numB || 0);
        return sortAsc ? cmp : -cmp;
      });
  }, [items, minProfit, minRoi, searchTerm, sortBy, sortAsc, parsedGold, showSafeOnly]);

  return { items, filteredItems };
};
