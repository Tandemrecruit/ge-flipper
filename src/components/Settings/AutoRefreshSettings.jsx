import React, { useState, useEffect } from 'react';
import { REFRESH_INTERVALS } from '../../utils/constants';

const STORAGE_KEY = 'ge-auto-refresh-interval';

export default function AutoRefreshSettings({ onIntervalChange }) {
  const [interval, setInterval] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved) : 60000; // Default 1 minute
    } catch {
      return 60000;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, interval.toString());
    } catch (err) {
      console.error('Failed to save auto-refresh interval:', err);
    }
    if (onIntervalChange) {
      onIntervalChange(interval);
    }
  }, [interval, onIntervalChange]);

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 22 }}>
        ⚙️ Auto-Refresh Settings
      </h3>
      
      <div style={{ 
        backgroundColor: '#1a1611', 
        padding: 16, 
        borderRadius: 8, 
        border: '1px solid #3a3429',
        maxWidth: 400
      }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ 
            display: 'block', 
            color: '#d4a84b', 
            fontSize: 16, 
            marginBottom: 8 
          }}>
            Price Refresh Interval
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#2a2419',
              color: '#f5ead6',
              border: '1px solid #d4a84b',
              borderRadius: 4,
              fontSize: 18
            }}
          >
            {REFRESH_INTERVALS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ 
          color: '#9e9e9e', 
          fontSize: 15, 
          marginTop: 8,
          padding: 8,
          backgroundColor: '#2a2419',
          borderRadius: 4
        }}>
          {interval === 0 
            ? 'Auto-refresh is disabled. Prices will only update when you manually refresh.'
            : `Prices will automatically refresh every ${REFRESH_INTERVALS.find(o => o.value === interval)?.label.toLowerCase() || 'minute'}.`}
        </div>
      </div>
    </div>
  );
}
