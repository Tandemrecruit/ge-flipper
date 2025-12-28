import React, { useMemo } from 'react';
import { useFlipTracker } from '../../hooks/useFlipTracker';
import { useItems } from '../../hooks/useItems';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import { formatNumber } from '../../utils/formatters';
import { computeSuggestionScore } from '../../utils/suggestions';

/**
 * SuggestionEvaluation - Validates suggestion accuracy against actual flip history
 * 
 * Compares which items the scoring system would have suggested vs actual flip outcomes
 * to measure how well the new accuracy improvements are working.
 */
export default function SuggestionEvaluation({ prices, volumes, mapping }) {
  const { flipLog, itemAnalytics } = useFlipTracker();
  const { getVolatility } = usePriceHistory(prices, mapping, flipLog);
  const { items } = useItems(prices, volumes, mapping);
  
  const evaluation = useMemo(() => {
    // Get completed flips with actual profit data
    const completedFlips = flipLog.filter(f => f.status === 'complete' && f.actualProfit !== null);
    
    if (completedFlips.length < 3) {
      return null; // Not enough data
    }
    
    // Build a map of items by ID for quick lookup
    const itemsById = {};
    items.forEach(item => {
      itemsById[item.id] = item;
    });
    
    // Analyze each completed flip
    const analyzedFlips = completedFlips.map(flip => {
      const currentItem = itemsById[flip.itemId];
      
      // Compute what score this item would have received NOW
      // (Note: we can't perfectly backtest since we don't have historical prices at flip time)
      let score = null;
      let confidence = null;
      let wouldHaveSuggested = false;
      
      if (currentItem) {
        const volatilityData = getVolatility(String(currentItem.id), 7);
        const result = computeSuggestionScore(currentItem, volatilityData);
        score = result.score;
        confidence = result.confidence;
        wouldHaveSuggested = score >= 45 && currentItem.isSafeFlip && currentItem.freshnessStatus !== 'stale';
      }
      
      const wasProfit = flip.actualProfit > 0;
      const profitMargin = flip.buyPrice > 0 
        ? ((flip.actualProfit / (flip.buyPrice * flip.quantity)) * 100) 
        : 0;
      
      return {
        ...flip,
        score,
        confidence,
        wouldHaveSuggested,
        wasProfit,
        profitMargin
      };
    });
    
    // Group by score brackets
    const scoreBrackets = {
      high: { min: 70, flips: [], wins: 0, losses: 0, totalProfit: 0 },
      medium: { min: 45, max: 69, flips: [], wins: 0, losses: 0, totalProfit: 0 },
      low: { min: 0, max: 44, flips: [], wins: 0, losses: 0, totalProfit: 0 },
      unscored: { flips: [], wins: 0, losses: 0, totalProfit: 0 }
    };
    
    analyzedFlips.forEach(flip => {
      let bracket;
      if (flip.score === null) {
        bracket = scoreBrackets.unscored;
      } else if (flip.score >= 70) {
        bracket = scoreBrackets.high;
      } else if (flip.score >= 45) {
        bracket = scoreBrackets.medium;
      } else {
        bracket = scoreBrackets.low;
      }
      
      bracket.flips.push(flip);
      bracket.totalProfit += flip.actualProfit || 0;
      if (flip.wasProfit) bracket.wins++;
      else bracket.losses++;
    });
    
    // Compute win rates for each bracket
    Object.values(scoreBrackets).forEach(bracket => {
      bracket.count = bracket.flips.length;
      bracket.winRate = bracket.count > 0 
        ? (bracket.wins / bracket.count * 100) 
        : 0;
      bracket.avgProfit = bracket.count > 0 
        ? bracket.totalProfit / bracket.count 
        : 0;
    });
    
    // Compute overall stats
    const suggestedFlips = analyzedFlips.filter(f => f.wouldHaveSuggested);
    const notSuggestedFlips = analyzedFlips.filter(f => !f.wouldHaveSuggested);
    
    const suggestedWinRate = suggestedFlips.length > 0
      ? (suggestedFlips.filter(f => f.wasProfit).length / suggestedFlips.length * 100)
      : 0;
    const notSuggestedWinRate = notSuggestedFlips.length > 0
      ? (notSuggestedFlips.filter(f => f.wasProfit).length / notSuggestedFlips.length * 100)
      : 0;
    
    const suggestedAvgProfit = suggestedFlips.length > 0
      ? suggestedFlips.reduce((sum, f) => sum + (f.actualProfit || 0), 0) / suggestedFlips.length
      : 0;
    const notSuggestedAvgProfit = notSuggestedFlips.length > 0
      ? notSuggestedFlips.reduce((sum, f) => sum + (f.actualProfit || 0), 0) / notSuggestedFlips.length
      : 0;
    
    return {
      totalFlips: analyzedFlips.length,
      scoreBrackets,
      suggestedCount: suggestedFlips.length,
      suggestedWinRate,
      suggestedAvgProfit,
      notSuggestedCount: notSuggestedFlips.length,
      notSuggestedWinRate,
      notSuggestedAvgProfit,
      accuracy: suggestedWinRate > notSuggestedWinRate ? 'good' : 'needs_improvement'
    };
  }, [flipLog, items, getVolatility]);
  
  if (!evaluation) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 20 }}>
          Suggestion Accuracy
        </h3>
        <p style={{ color: '#d4a84b', fontSize: 13 }}>
          Complete at least 3 flips to see accuracy analysis.
        </p>
      </div>
    );
  }
  
  const { scoreBrackets, suggestedWinRate, notSuggestedWinRate, suggestedAvgProfit, notSuggestedAvgProfit, accuracy } = evaluation;
  
  const getBracketColor = (winRate) => {
    if (winRate >= 70) return '#4caf50';
    if (winRate >= 50) return '#ff9800';
    return '#f44336';
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 20 }}>
        Suggestion Accuracy Analysis
      </h3>
      <p style={{ color: '#d4a84b', fontSize: 13, marginBottom: 16 }}>
        How well did the scoring system predict profitable flips?
      </p>
      
      {/* Overall comparison */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{
          backgroundColor: '#1a1611',
          border: '1px solid #3a3429',
          borderRadius: 8,
          padding: 16
        }}>
          <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 8 }}>Would Have Suggested</div>
          <div style={{ color: '#4caf50', fontSize: 24, fontWeight: 600 }}>
            {suggestedWinRate.toFixed(1)}% Win Rate
          </div>
          <div style={{ color: '#8bc34a', fontSize: 14 }}>
            {evaluation.suggestedCount} flips, avg {formatNumber(suggestedAvgProfit)} gp
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#1a1611',
          border: '1px solid #3a3429',
          borderRadius: 8,
          padding: 16
        }}>
          <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 8 }}>Would NOT Have Suggested</div>
          <div style={{ color: getBracketColor(notSuggestedWinRate), fontSize: 24, fontWeight: 600 }}>
            {notSuggestedWinRate.toFixed(1)}% Win Rate
          </div>
          <div style={{ color: '#9e9e9e', fontSize: 14 }}>
            {evaluation.notSuggestedCount} flips, avg {formatNumber(notSuggestedAvgProfit)} gp
          </div>
        </div>
      </div>
      
      {/* Score bracket breakdown */}
      <h4 style={{ color: '#f5ead6', fontSize: 16, marginBottom: 12 }}>Win Rate by Score Bracket</h4>
      <div style={{ display: 'grid', gap: 12 }}>
        {[
          { key: 'high', label: 'High Score (70+)', icon: '🎯' },
          { key: 'medium', label: 'Medium Score (45-69)', icon: '📊' },
          { key: 'low', label: 'Low Score (0-44)', icon: '⚠️' },
          { key: 'unscored', label: 'Not Scored (item unavailable)', icon: '❓' }
        ].map(({ key, label, icon }) => {
          const bracket = scoreBrackets[key];
          if (bracket.count === 0) return null;
          
          return (
            <div
              key={key}
              style={{
                backgroundColor: '#1a1611',
                border: '1px solid #3a3429',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <div style={{ color: '#f5ead6', fontSize: 14, fontWeight: 500 }}>{label}</div>
                  <div style={{ color: '#9e9e9e', fontSize: 12 }}>
                    {bracket.count} flips ({bracket.wins} wins, {bracket.losses} losses)
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: getBracketColor(bracket.winRate), fontSize: 18, fontWeight: 600 }}>
                  {bracket.winRate.toFixed(1)}%
                </div>
                <div style={{ color: '#d4a84b', fontSize: 12 }}>
                  avg {formatNumber(bracket.avgProfit)} gp
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Accuracy verdict */}
      <div style={{
        marginTop: 20,
        padding: 16,
        backgroundColor: accuracy === 'good' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
        border: `1px solid ${accuracy === 'good' ? '#4caf50' : '#ff9800'}`,
        borderRadius: 8
      }}>
        <div style={{ 
          color: accuracy === 'good' ? '#4caf50' : '#ff9800', 
          fontSize: 14, 
          fontWeight: 600 
        }}>
          {accuracy === 'good' 
            ? '✅ Scoring is working well - suggested items have higher win rates!'
            : '⚠️ Scoring needs tuning - consider adjusting filters or trying more flips.'
          }
        </div>
        {suggestedWinRate > notSuggestedWinRate && (
          <div style={{ color: '#f5ead6', fontSize: 13, marginTop: 8 }}>
            Suggestions outperform by {(suggestedWinRate - notSuggestedWinRate).toFixed(1)} percentage points.
          </div>
        )}
      </div>
    </div>
  );
}
