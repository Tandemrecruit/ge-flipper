import React, { useMemo } from 'react';
import { useItems } from '../../hooks/useItems';
import { getItemIconUrl } from '../../utils/iconUrl';

export default function CompetitionAnalysis({ prices, volumes, mapping }) {
  const { items } = useItems(prices, volumes, mapping);

  const analysis = useMemo(() => {
    const analyzed = items
      .filter(item => item.isSafeFlip && item.suggestedProfit > 0)
      .map(item => {
        const dailyVolume = item.volume || 0;
        const competitionScore = typeof item.competitionScore === 'number' ? item.competitionScore : 0;
        const competitionLevel = item.competitionLevel || 'Unknown';

        // Estimate number of flippers (very rough): log-scale limits/day.
        const buyLimit = item.buyLimit || 0;
        const limitsPerDay = (dailyVolume > 0 && buyLimit > 0) ? (dailyVolume / buyLimit) : 0;
        const estimatedFlippers = Math.max(1, Math.round(Math.log10(limitsPerDay + 1) * 8));

        // Conservative profit under competition pressure.
        const adjustedProfit = (typeof item.competitionAdjustedProfit === 'number')
          ? item.competitionAdjustedProfit
          : item.suggestedProfit;
        
        return {
          ...item,
          competitionScore,
          competitionLevel,
          estimatedFlippers,
          adjustedProfit,
          opportunity: adjustedProfit >= item.suggestedProfit * 0.8 ? 'Good' : adjustedProfit >= item.suggestedProfit * 0.6 ? 'Fair' : 'Poor'
        };
      })
      .sort((a, b) => {
        // Sort by opportunity (good opportunities first)
        const oppOrder = { Good: 3, Fair: 2, Poor: 1 };
        if (oppOrder[a.opportunity] !== oppOrder[b.opportunity]) {
          return oppOrder[b.opportunity] - oppOrder[a.opportunity];
        }
        // Then by adjusted profit
        return b.adjustedProfit - a.adjustedProfit;
      })
      .slice(0, 20);

    return analyzed;
  }, [items]);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const getCompetitionColor = (level) => {
    switch (level) {
      case 'Low': return '#4caf50';
      case 'Medium': return '#ff9800';
      case 'High': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getOpportunityColor = (opp) => {
    switch (opp) {
      case 'Good': return '#4caf50';
      case 'Fair': return '#ff9800';
      case 'Poor': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  if (analysis.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
        No items available for competition analysis
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 22 }}>
        🎯 Competition Analysis
      </h3>
      <p style={{ color: '#d4a84b', fontSize: 20, marginBottom: 16 }}>
        Competition is estimated from liquidity/activity (daily + 5m volume), spread tightness, ROI attraction, buy-limit turnover, and update freshness.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {analysis.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              backgroundColor: '#1a1611',
              border: '1px solid #3a3429',
              borderRadius: 8,
              padding: 16,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto',
              gap: 16,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <img 
                src={getItemIconUrl(item)}
                alt={item.name}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            <div style={{ minWidth: 200 }}>
              <div style={{ color: '#f5ead6', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                {item.name}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 15 }}>
                <div>
                  <span style={{ color: '#d4a84b' }}>Volume: </span>
                  <span style={{ color: '#f5ead6' }}>{formatCurrency(item.volume || 0)}/day</span>
                </div>
                <div>
                  <span style={{ color: '#d4a84b' }}>Spread: </span>
                  <span style={{ color: '#f5ead6' }}>{item.spreadPercent.toFixed(2)}%</span>
                </div>
                <div>
                  <span style={{ color: '#d4a84b' }}>Est. Flippers: </span>
                  <span style={{ color: '#f5ead6' }}>~{item.estimatedFlippers}</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{ color: '#d4a84b', fontSize: 14, marginBottom: 4 }}>Competition</div>
              <div style={{ 
                color: getCompetitionColor(item.competitionLevel), 
                fontSize: 20, 
                fontWeight: 600 
              }}>
                {item.competitionLevel}
              </div>
              <div style={{ color: '#9e9e9e', fontSize: 14, marginTop: 4 }}>
                {item.competitionScore.toFixed(0)}/100
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: 150 }}>
              <div style={{ color: '#d4a84b', fontSize: 14, marginBottom: 4 }}>Adjusted Profit</div>
              <div style={{ 
                color: getOpportunityColor(item.opportunity), 
                fontSize: 23, 
                fontWeight: 600 
              }}>
                {formatCurrency(item.adjustedProfit)}
              </div>
              <div style={{ 
                color: item.suggestedProfit > item.adjustedProfit ? '#f44336' : '#4caf50', 
                fontSize: 14, 
                marginTop: 4 
              }}>
                vs {formatCurrency(item.suggestedProfit)} expected
              </div>
              <div style={{ 
                color: getOpportunityColor(item.opportunity), 
                fontSize: 14, 
                marginTop: 4 
              }}>
                {item.opportunity} Opportunity
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
