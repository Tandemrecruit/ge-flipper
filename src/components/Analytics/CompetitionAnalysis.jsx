import React, { useMemo } from 'react';
import { useItems } from '../../hooks/useItems';
import { calculateTax } from '../../utils/calculations';

export default function CompetitionAnalysis({ prices, volumes, mapping }) {
  const { items } = useItems(prices, volumes, mapping);

  const analysis = useMemo(() => {
    const analyzed = items
      .filter(item => item.isSafeFlip && item.netProfit > 0)
      .map(item => {
        // Estimate competition based on volume and spread
        // Higher volume + lower spread = more competition
        // Lower volume + higher spread = less competition
        
        const dailyVolume = item.volume || 0;
        const spread = item.spreadPercent || 0;
        
        // Competition score: 0-100 (higher = more competition)
        // Based on volume tier and spread tightness
        let competitionScore = 0;
        
        if (item.isVeryHighVolume) {
          competitionScore += 40; // High volume = more flippers
        } else if (item.isHighVolume) {
          competitionScore += 25;
        } else {
          competitionScore += 10;
        }
        
        // Tight spreads indicate active competition
        if (spread < 2.5) {
          competitionScore += 30;
        } else if (spread < 3.5) {
          competitionScore += 20;
        } else if (spread < 4.5) {
          competitionScore += 10;
        }
        
        // Estimate number of flippers (rough heuristic)
        // Assume each flipper buys ~1% of daily volume on average
        const estimatedFlippers = Math.max(1, Math.round(dailyVolume / (item.buyLimit || 1000) * 0.01));
        
        // Profitability after competition
        const competitionFactor = competitionScore / 100;
        const adjustedProfit = item.netProfit * (1 - competitionFactor * 0.3); // Up to 30% reduction
        
        let competitionLevel = 'Low';
        if (competitionScore >= 60) competitionLevel = 'High';
        else if (competitionScore >= 40) competitionLevel = 'Medium';
        
        return {
          ...item,
          competitionScore,
          competitionLevel,
          estimatedFlippers,
          adjustedProfit,
          opportunity: adjustedProfit > item.netProfit * 0.7 ? 'Good' : adjustedProfit > item.netProfit * 0.5 ? 'Fair' : 'Poor'
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
      <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 20 }}>
        🎯 Competition Analysis
      </h3>
      <p style={{ color: '#d4a84b', fontSize: 13, marginBottom: 16 }}>
        Estimated competition levels based on volume and spread patterns. Lower competition = better opportunities.
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
                src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon?.replace(/ /g, '_') || item.name.replace(/ /g, '_'))}.png`}
                alt={item.name}
                style={{ width: 40, height: 40, objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            <div style={{ minWidth: 200 }}>
              <div style={{ color: '#f5ead6', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {item.name}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
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
              <div style={{ color: '#d4a84b', fontSize: 11, marginBottom: 4 }}>Competition</div>
              <div style={{ 
                color: getCompetitionColor(item.competitionLevel), 
                fontSize: 16, 
                fontWeight: 600 
              }}>
                {item.competitionLevel}
              </div>
              <div style={{ color: '#9e9e9e', fontSize: 11, marginTop: 4 }}>
                {item.competitionScore.toFixed(0)}/100
              </div>
            </div>

            <div style={{ textAlign: 'right', minWidth: 150 }}>
              <div style={{ color: '#d4a84b', fontSize: 11, marginBottom: 4 }}>Adjusted Profit</div>
              <div style={{ 
                color: getOpportunityColor(item.opportunity), 
                fontSize: 18, 
                fontWeight: 600 
              }}>
                {formatCurrency(item.adjustedProfit)}
              </div>
              <div style={{ 
                color: item.netProfit > item.adjustedProfit ? '#f44336' : '#4caf50', 
                fontSize: 11, 
                marginTop: 4 
              }}>
                vs {formatCurrency(item.netProfit)} base
              </div>
              <div style={{ 
                color: getOpportunityColor(item.opportunity), 
                fontSize: 11, 
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
