import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProfitTimeline({ flipLog }) {
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

  const timelineData = useMemo(() => {
    const completed = flipLog.filter(f => f.status === 'complete' && f.actualProfit !== null);
    
    if (completed.length === 0) return [];

    const dataMap = {};

    completed.forEach(flip => {
      const date = new Date(flip.date);
      let key;

      if (viewMode === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (viewMode === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        key = weekStart.toISOString().split('T')[0];
      } else { // monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!dataMap[key]) {
        dataMap[key] = {
          period: key,
          profit: 0,
          flips: 0,
          expected: 0,
          tax: 0
        };
      }

      dataMap[key].profit += flip.actualProfit || 0;
      dataMap[key].expected += flip.expectedProfit || 0;
      dataMap[key].tax += flip.tax || 0;
      dataMap[key].flips += 1;
    });

    const sorted = Object.values(dataMap).sort((a, b) => 
      new Date(a.period) - new Date(b.period)
    );

    // Format labels based on view mode
    return sorted.map(item => {
      let label = item.period;
      if (viewMode === 'daily') {
        label = new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (viewMode === 'weekly') {
        const weekEnd = new Date(item.period);
        weekEnd.setDate(weekEnd.getDate() + 6);
        label = `${new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        label = new Date(item.period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      return {
        ...item,
        label,
        cumulativeProfit: 0 // Will calculate below
      };
    }).map((item, index, array) => {
      const BASE_FUNDING = 2000000; // 2M starting capital
      const cumulative = BASE_FUNDING + array.slice(0, index + 1).reduce((sum, i) => sum + i.profit, 0);
      return { ...item, cumulativeProfit: cumulative };
    });
  }, [flipLog, viewMode]);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const totalProfit = timelineData.reduce((sum, d) => sum + d.profit, 0);
  const totalFlips = timelineData.reduce((sum, d) => sum + d.flips, 0);
  const avgProfitPerFlip = totalFlips > 0 ? totalProfit / totalFlips : 0;

  if (timelineData.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
        No completed flips to display. Complete some flips to see your profit timeline!
      </div>
    );
  }

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ margin: 0, color: '#f5ead6', fontSize: 20 }}>💰 Profit Timeline</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2a2419',
              color: '#f5ead6',
              border: '1px solid #d4a84b',
              borderRadius: 4,
              fontSize: 13
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2a2419',
              color: '#f5ead6',
              border: '1px solid #d4a84b',
              borderRadius: 4,
              fontSize: 13
            }}
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#1a1611', 
        padding: 16, 
        borderRadius: 8, 
        border: '1px solid #3a3429',
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16
      }}>
        <div>
          <div style={{ color: '#d4a84b', fontSize: 12 }}>Total Profit</div>
          <div style={{ color: totalProfit >= 0 ? '#4caf50' : '#f44336', fontSize: 18, fontWeight: 600 }}>
            {formatCurrency(totalProfit)}
          </div>
        </div>
        <div>
          <div style={{ color: '#d4a84b', fontSize: 12 }}>Total Flips</div>
          <div style={{ color: '#f5ead6', fontSize: 18, fontWeight: 600 }}>
            {totalFlips}
          </div>
        </div>
        <div>
          <div style={{ color: '#d4a84b', fontSize: 12 }}>Avg Profit/Flip</div>
          <div style={{ color: '#f5ead6', fontSize: 18, fontWeight: 600 }}>
            {formatCurrency(avgProfitPerFlip)}
          </div>
        </div>
        <div>
          <div style={{ color: '#d4a84b', fontSize: 12 }}>Periods Tracked</div>
          <div style={{ color: '#f5ead6', fontSize: 18, fontWeight: 600 }}>
            {timelineData.length}
          </div>
        </div>
      </div>

      <div style={{ height: 400, width: '100%' }}>
        <ResponsiveContainer>
          <ChartComponent data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3429" />
            <XAxis 
              dataKey="label"
              stroke="#d4a84b"
              style={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#d4a84b"
              style={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1611', 
                border: '1px solid #d4a84b',
                color: '#f5ead6',
                borderRadius: 4
              }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend 
              wrapperStyle={{ color: '#f5ead6' }}
            />
            <DataComponent 
              type="monotone" 
              dataKey="profit" 
              stroke={chartType === 'line' ? "#4caf50" : undefined}
              fill={chartType === 'bar' ? "#4caf50" : undefined}
              strokeWidth={2}
              name="Profit"
            />
            <DataComponent 
              type="monotone" 
              dataKey="cumulativeProfit" 
              stroke={chartType === 'line' ? "#d4a84b" : undefined}
              fill={chartType === 'bar' ? "#d4a84b" : undefined}
              strokeWidth={2}
              strokeDasharray={chartType === 'line' ? "5 5" : undefined}
              name="Cumulative Profit"
            />
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
