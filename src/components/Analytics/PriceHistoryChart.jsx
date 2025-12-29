import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePriceHistory } from '../../hooks/usePriceHistory';

export default function PriceHistoryChart({ itemId: propItemId, itemName: propItemName, prices, mapping }) {
  const [timeRange, setTimeRange] = useState(7); // days
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'detailed'
  const [selectedItemId, setSelectedItemId] = useState(propItemId || null);

  const itemId = selectedItemId || propItemId;
  const { getDailyHistory, getItemHistory } = usePriceHistory(prices, mapping, [], [], itemId);

  // Get items with price history
  const itemsWithHistory = useMemo(() => {
    return Object.values(mapping || {})
      .filter(item => prices[item.id] && (prices[item.id].high || prices[item.id].low))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [mapping, prices]);
  const itemName = propItemName || (itemId ? mapping[itemId]?.name : null);

  if (!itemId || !prices[itemId]) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
        {propItemId ? 'No price data available for this item' : 'Select an item from the dropdown to view price history'}
      </div>
    );
  }

  const currentPrice = prices[itemId];
  const history = viewMode === 'daily' 
    ? getDailyHistory(itemId, timeRange)
    : getItemHistory(itemId, timeRange);

  if (history.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#f5ead6' }}>
        No price history available for this item
      </div>
    );
  }

  // Format data for chart
  const chartData = viewMode === 'daily'
    ? history.map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        high: day.high,
        low: day.low,
        avgHigh: Math.round(day.avgHigh),
        avgLow: Math.round(day.avgLow)
      }))
    : history.map(entry => ({
        time: new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        label: `${new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        high: entry.high,
        low: entry.low
      }));

  const formatCurrency = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ margin: 0, color: '#f5ead6', fontSize: 22 }}>
          📈 Price History
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!propItemId && (
            <select
              value={selectedItemId || ''}
              onChange={(e) => setSelectedItemId(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#2a2419',
                color: '#f5ead6',
                border: '1px solid #d4a84b',
                borderRadius: 4,
                fontSize: 16,
                minWidth: 200
              }}
            >
              <option value="">Select an item...</option>
              {itemsWithHistory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2a2419',
              color: '#f5ead6',
              border: '1px solid #d4a84b',
              borderRadius: 4,
              fontSize: 16
            }}
          >
            <option value={1}>Last 24 Hours</option>
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2a2419',
              color: '#f5ead6',
              border: '1px solid #d4a84b',
              borderRadius: 4,
              fontSize: 16
            }}
          >
            <option value="daily">Daily View</option>
            <option value="detailed">Detailed View</option>
          </select>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#1a1611', 
        padding: 16, 
        borderRadius: 8, 
        border: '1px solid #3a3429',
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ color: '#d4a84b', fontSize: 15 }}>Current High</div>
            <div style={{ color: '#f5ead6', fontSize: 23, fontWeight: 600 }}>
              {formatCurrency(currentPrice.high)}
            </div>
          </div>
          <div>
            <div style={{ color: '#d4a84b', fontSize: 15 }}>Current Low</div>
            <div style={{ color: '#f5ead6', fontSize: 23, fontWeight: 600 }}>
              {formatCurrency(currentPrice.low)}
            </div>
          </div>
          <div>
            <div style={{ color: '#d4a84b', fontSize: 15 }}>Spread</div>
            <div style={{ color: '#f5ead6', fontSize: 23, fontWeight: 600 }}>
              {((currentPrice.high - currentPrice.low) / currentPrice.low * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 400, width: '100%' }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3429" />
            <XAxis 
              dataKey={viewMode === 'daily' ? 'date' : 'label'}
              stroke="#d4a84b"
              style={{ fontSize: 15 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#d4a84b"
              style={{ fontSize: 15 }}
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
            {viewMode === 'daily' ? (
              <>
                <Line 
                  type="monotone" 
                  dataKey="high" 
                  stroke="#4caf50" 
                  strokeWidth={2}
                  name="Daily High"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="low" 
                  stroke="#f44336" 
                  strokeWidth={2}
                  name="Daily Low"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgHigh" 
                  stroke="#81c784" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Avg High"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgLow" 
                  stroke="#e57373" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  name="Avg Low"
                  dot={false}
                />
              </>
            ) : (
              <>
                <Line 
                  type="monotone" 
                  dataKey="high" 
                  stroke="#4caf50" 
                  strokeWidth={2}
                  name="High Price"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="low" 
                  stroke="#f44336" 
                  strokeWidth={2}
                  name="Low Price"
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
