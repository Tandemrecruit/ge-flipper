import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFlipTracker } from '../../hooks/useFlipTracker';

const COLORS = ['#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0', '#00bcd4'];

export default function ROIDashboard() {
  const { flipLog, itemAnalytics } = useFlipTracker();

  const portfolioMetrics = useMemo(() => {
    const completed = flipLog.filter(f => f.status === 'complete' && f.actualProfit !== null);
    const pending = flipLog.filter(f => f.status === 'pending');

    const totalInvested = completed.reduce((sum, f) => sum + (f.buyPrice * f.quantity), 0);
    const totalReturn = completed.reduce((sum, f) => sum + (f.netSellPrice || f.sellPrice || 0) * f.quantity, 0);
    const totalProfit = completed.reduce((sum, f) => sum + (f.actualProfit || 0), 0);
    const pendingInvestment = pending.reduce((sum, f) => sum + (f.buyPrice * f.quantity), 0);

    const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const totalROI = totalInvested > 0 ? ((totalReturn - totalInvested) / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalReturn,
      totalProfit,
      pendingInvestment,
      roi,
      totalROI,
      completedFlips: completed.length,
      pendingFlips: pending.length
    };
  }, [flipLog]);

  const topPerformers = useMemo(() => {
    return itemAnalytics
      .filter(item => item.flips >= 2)
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10)
      .map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        fullName: item.name,
        roi: item.roi,
        profit: item.totalProfit,
        flips: item.flips
      }));
  }, [itemAnalytics]);

  const worstPerformers = useMemo(() => {
    return itemAnalytics
      .filter(item => item.flips >= 2 && item.totalProfit < 0)
      .sort((a, b) => a.roi - b.roi)
      .slice(0, 10)
      .map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        fullName: item.name,
        roi: item.roi,
        profit: item.totalProfit,
        flips: item.flips
      }));
  }, [itemAnalytics]);

  const profitDistribution = useMemo(() => {
    const ranges = [
      { name: '< 0', min: -Infinity, max: 0, count: 0, profit: 0 },
      { name: '0-10K', min: 0, max: 10000, count: 0, profit: 0 },
      { name: '10K-50K', min: 10000, max: 50000, count: 0, profit: 0 },
      { name: '50K-100K', min: 50000, max: 100000, count: 0, profit: 0 },
      { name: '100K-500K', min: 100000, max: 500000, count: 0, profit: 0 },
      { name: '500K+', min: 500000, max: Infinity, count: 0, profit: 0 }
    ];

    flipLog
      .filter(f => f.status === 'complete' && f.actualProfit !== null)
      .forEach(flip => {
        const profit = flip.actualProfit || 0;
        const range = ranges.find(r => profit >= r.min && profit < r.max);
        if (range) {
          range.count++;
          range.profit += profit;
        }
      });

    return ranges.filter(r => r.count > 0);
  }, [flipLog]);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 20 }}>📊 ROI Dashboard</h3>

      {/* Portfolio Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ 
          backgroundColor: '#1a1611', 
          padding: 16, 
          borderRadius: 8, 
          border: '1px solid #3a3429'
        }}>
          <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 8 }}>Total ROI</div>
          <div style={{ 
            color: portfolioMetrics.roi >= 0 ? '#4caf50' : '#f44336', 
            fontSize: 24, 
            fontWeight: 600 
          }}>
            {portfolioMetrics.roi.toFixed(2)}%
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#1a1611', 
          padding: 16, 
          borderRadius: 8, 
          border: '1px solid #3a3429'
        }}>
          <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 8 }}>Total Profit</div>
          <div style={{ 
            color: portfolioMetrics.totalProfit >= 0 ? '#4caf50' : '#f44336', 
            fontSize: 24, 
            fontWeight: 600 
          }}>
            {formatCurrency(portfolioMetrics.totalProfit)}
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#1a1611', 
          padding: 16, 
          borderRadius: 8, 
          border: '1px solid #3a3429'
        }}>
          <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 8 }}>Total Invested</div>
          <div style={{ color: '#f5ead6', fontSize: 24, fontWeight: 600 }}>
            {formatCurrency(portfolioMetrics.totalInvested)}
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#1a1611', 
          padding: 16, 
          borderRadius: 8, 
          border: '1px solid #3a3429'
        }}>
          <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 8 }}>Pending Investment</div>
          <div style={{ color: '#ff9800', fontSize: 24, fontWeight: 600 }}>
            {formatCurrency(portfolioMetrics.pendingInvestment)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Top Performers */}
        <div>
          <h4 style={{ color: '#f5ead6', marginBottom: 16 }}>🏆 Top Performers (by ROI)</h4>
          {topPerformers.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={topPerformers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3429" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#d4a84b"
                    style={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#d4a84b"
                    style={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1611', 
                      border: '1px solid #d4a84b',
                      color: '#f5ead6',
                      borderRadius: 4
                    }}
                    formatter={(value, name) => {
                      if (name === 'roi') return `${value.toFixed(2)}%`;
                      return formatCurrency(value);
                    }}
                  />
                  <Bar dataKey="roi" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
              Need at least 2 flips per item to show ROI
            </div>
          )}
        </div>

        {/* Profit Distribution */}
        <div>
          <h4 style={{ color: '#f5ead6', marginBottom: 16 }}>📈 Profit Distribution</h4>
          {profitDistribution.length > 0 ? (
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={profitDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {profitDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1611', 
                      border: '1px solid #d4a84b',
                      color: '#f5ead6',
                      borderRadius: 4
                    }}
                    formatter={(value, name) => {
                      if (name === 'profit') return formatCurrency(value);
                      return value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
              No completed flips to analyze
            </div>
          )}
        </div>
      </div>

      {/* Worst Performers */}
      {worstPerformers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ color: '#f5ead6', marginBottom: 16 }}>⚠️ Items to Avoid (Negative ROI)</h4>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={worstPerformers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3429" />
                <XAxis 
                  dataKey="name" 
                  stroke="#d4a84b"
                  style={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#d4a84b"
                  style={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1611', 
                    border: '1px solid #d4a84b',
                    color: '#f5ead6',
                    borderRadius: 4
                  }}
                  formatter={(value, name) => {
                    if (name === 'roi') return `${value.toFixed(2)}%`;
                    return formatCurrency(value);
                  }}
                />
                <Bar dataKey="roi" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
