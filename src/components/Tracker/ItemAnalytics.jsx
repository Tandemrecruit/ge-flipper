import React, { useState } from 'react';
import { formatGp, formatNumber } from '../../utils/formatters';

export default function ItemAnalytics({ itemAnalytics, topPerformers }) {
  const [activeTab, setActiveTab] = useState('most');

  if (!itemAnalytics || itemAnalytics.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#8b7355' }}>
        Complete some flips to see analytics
      </div>
    );
  }

  const renderItemRow = (item, index, showDetails = false) => (
    <tr 
      key={item.name}
      style={{ 
        background: index % 2 === 0 ? 'transparent' : 'rgba(90, 74, 53, 0.2)',
        borderBottom: '1px solid rgba(90, 74, 53, 0.3)'
      }}
    >
      <td style={{ padding: '12px', fontWeight: 600, color: '#f5ead6' }}>{item.name}</td>
      <td style={{ padding: '12px', textAlign: 'right', color: '#f5ead6' }}>{item.flips}</td>
      <td style={{ padding: '12px', textAlign: 'right', color: item.totalProfit >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
        {formatGp(item.totalProfit)}
      </td>
      <td style={{ padding: '12px', textAlign: 'right', color: item.roi >= 0 ? '#4ade80' : '#f87171' }}>
        {item.roi.toFixed(1)}%
      </td>
      <td style={{ padding: '12px', textAlign: 'right', color: '#93c5fd' }}>
        {formatGp(item.avgBuyPrice)}
      </td>
      <td style={{ padding: '12px', textAlign: 'right', color: '#fde68a' }}>
        {formatGp(item.avgSellPrice)}
      </td>
      <td style={{ padding: '12px', textAlign: 'right', color: item.winRate >= 50 ? '#4ade80' : '#f87171' }}>
        {item.winRate.toFixed(0)}%
      </td>
      {showDetails && (
        <>
          <td style={{ padding: '12px', textAlign: 'right', color: '#f5ead6' }}>
            {formatGp(item.bestFlip?.actualProfit || 0)}
          </td>
          <td style={{ padding: '12px', textAlign: 'right', color: '#f5ead6' }}>
            {formatGp(item.worstFlip?.actualProfit || 0)}
          </td>
        </>
      )}
    </tr>
  );

  const renderPriceAnalysis = (item) => {
    if (!item.buyPrices || item.buyPrices.length === 0) return null;
    
    const bestBuyPrice = Math.min(...item.buyPrices);
    const worstBuyPrice = Math.max(...item.buyPrices);
    const bestSellPrice = item.sellPrices ? Math.max(...item.sellPrices.filter(p => p)) : null;
    const worstSellPrice = item.sellPrices ? Math.min(...item.sellPrices.filter(p => p)) : null;

    return (
      <div style={{ marginTop: 16, padding: 12, background: 'rgba(90, 74, 53, 0.2)', borderRadius: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#8b7355', marginBottom: 8 }}>Price Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 20 }}>
          <div>
            <div style={{ color: '#93c5fd' }}>Best Buy: {formatGp(bestBuyPrice)}</div>
            <div style={{ color: '#f87171' }}>Worst Buy: {formatGp(worstBuyPrice)}</div>
          </div>
          {bestSellPrice && worstSellPrice && (
            <div>
              <div style={{ color: '#4ade80' }}>Best Sell: {formatGp(bestSellPrice)}</div>
              <div style={{ color: '#f87171' }}>Worst Sell: {formatGp(worstSellPrice)}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid rgba(90, 74, 53, 0.4)' }}>
        <button
          className="btn"
          onClick={() => setActiveTab('most')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'most' ? 'rgba(96, 165, 250, 0.3)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'most' ? '2px solid #60a5fa' : '2px solid transparent',
            borderRadius: 0
          }}
        >
          Most Effective
        </button>
        <button
          className="btn"
          onClick={() => setActiveTab('least')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'least' ? 'rgba(96, 165, 250, 0.3)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'least' ? '2px solid #60a5fa' : '2px solid transparent',
            borderRadius: 0
          }}
        >
          Least Effective
        </button>
        <button
          className="btn"
          onClick={() => setActiveTab('prices')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'prices' ? 'rgba(96, 165, 250, 0.3)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'prices' ? '2px solid #60a5fa' : '2px solid transparent',
            borderRadius: 0
          }}
        >
          Price Analysis
        </button>
      </div>

      {activeTab === 'most' && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#60a5fa', marginBottom: 12, fontSize: 20 }}>Top Profit Makers</h3>
            <div className="gold-border" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'rgba(90, 74, 53, 0.6)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Flips</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Total Profit</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>ROI</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Buy</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Sell</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.profit.slice(0, 10).map((item, idx) => renderItemRow(item, idx))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#60a5fa', marginBottom: 12, fontSize: 20 }}>Best ROI (3+ flips)</h3>
            <div className="gold-border" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'rgba(90, 74, 53, 0.6)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Flips</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Total Profit</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>ROI</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Buy</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Sell</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.roi.slice(0, 10).map((item, idx) => renderItemRow(item, idx))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 style={{ color: '#60a5fa', marginBottom: 12, fontSize: 20 }}>Highest Win Rate (3+ flips)</h3>
            <div className="gold-border" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'rgba(90, 74, 53, 0.6)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Flips</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Total Profit</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>ROI</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Buy</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Sell</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.winRate.slice(0, 10).map((item, idx) => renderItemRow(item, idx))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'least' && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#f87171', marginBottom: 12, fontSize: 20 }}>Biggest Losses</h3>
            <div className="gold-border" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'rgba(90, 74, 53, 0.6)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Flips</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Total Profit</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>ROI</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Buy</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Sell</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.loss.slice(0, 10).map((item, idx) => renderItemRow(item, idx))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 style={{ color: '#f87171', marginBottom: 12, fontSize: 20 }}>Worst ROI</h3>
            <div className="gold-border" style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: 'rgba(90, 74, 53, 0.6)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Flips</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Total Profit</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>ROI</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Buy</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Avg Sell</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6' }}>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {itemAnalytics
                    .filter(i => i.flips >= 1)
                    .sort((a, b) => a.roi - b.roi)
                    .slice(0, 10)
                    .map((item, idx) => renderItemRow(item, idx))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prices' && (
        <div>
          <h3 style={{ color: '#60a5fa', marginBottom: 12, fontSize: 20 }}>Price Effectiveness by Item</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            {itemAnalytics
              .filter(item => item.flips >= 2 && item.buyPrices && item.buyPrices.length >= 2)
              .slice(0, 20)
              .map((item) => {
                const bestBuyPrice = Math.min(...item.buyPrices);
                const worstBuyPrice = Math.max(...item.buyPrices);
                const bestSellPrice = item.sellPrices ? Math.max(...item.sellPrices.filter(p => p)) : null;
                const worstSellPrice = item.sellPrices ? Math.min(...item.sellPrices.filter(p => p)) : null;
                const buyPriceRange = worstBuyPrice - bestBuyPrice;
                const sellPriceRange = bestSellPrice && worstSellPrice ? bestSellPrice - worstSellPrice : 0;

                return (
                  <div key={item.name} className="gold-border" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ color: '#f5ead6', fontSize: 20, fontWeight: 600 }}>{item.name}</h4>
                      <div style={{ fontSize: 20, color: '#8b7355' }}>{item.flips} flips</div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 15, color: '#8b7355', marginBottom: 8 }}>Buy Prices</div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 14, color: '#93c5fd' }}>Best</div>
                            <div style={{ color: '#4ade80', fontWeight: 600 }}>{formatGp(bestBuyPrice)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, color: '#93c5fd' }}>Worst</div>
                            <div style={{ color: '#f87171', fontWeight: 600 }}>{formatGp(worstBuyPrice)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, color: '#93c5fd' }}>Range</div>
                            <div style={{ color: '#f5ead6' }}>{formatGp(buyPriceRange)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, color: '#93c5fd' }}>Avg</div>
                            <div style={{ color: '#f5ead6' }}>{formatGp(item.avgBuyPrice)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {bestSellPrice && worstSellPrice && (
                        <div>
                          <div style={{ fontSize: 15, color: '#8b7355', marginBottom: 8 }}>Sell Prices</div>
                          <div style={{ display: 'flex', gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 14, color: '#fde68a' }}>Best</div>
                              <div style={{ color: '#4ade80', fontWeight: 600 }}>{formatGp(bestSellPrice)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 14, color: '#fde68a' }}>Worst</div>
                              <div style={{ color: '#f87171', fontWeight: 600 }}>{formatGp(worstSellPrice)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 14, color: '#fde68a' }}>Range</div>
                              <div style={{ color: '#f5ead6' }}>{formatGp(sellPriceRange)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 14, color: '#fde68a' }}>Avg</div>
                              <div style={{ color: '#f5ead6' }}>{formatGp(item.avgSellPrice)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginTop: 12, padding: 8, background: 'rgba(90, 74, 53, 0.2)', borderRadius: 4, fontSize: 20 }}>
                      <span style={{ color: '#8b7355' }}>Total Profit: </span>
                      <span style={{ color: item.totalProfit >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                        {formatGp(item.totalProfit)}
                      </span>
                      <span style={{ color: '#8b7355', marginLeft: 16 }}>ROI: </span>
                      <span style={{ color: item.roi >= 0 ? '#4ade80' : '#f87171' }}>
                        {item.roi.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
