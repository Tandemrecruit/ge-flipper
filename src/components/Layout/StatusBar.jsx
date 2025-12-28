import React from 'react';
import { formatGp } from '../../utils/formatters';

export default function StatusBar({ lastUpdate, apiSource, usingSampleData, itemsCount, availableGold, onRefresh, loading }) {
  if (!lastUpdate) return null;

  return (
    <div style={{ marginTop: 14, fontSize: 14, color: '#d4c4a4', fontFamily: '"Crimson Text", serif' }}>
      {usingSampleData ? (
        <span style={{ color: '#fde68a', fontWeight: 600 }}>⚡ SAMPLE DATA • </span>
      ) : apiSource === 'proxy' ? (
        <span style={{ color: '#a7f3d0', fontWeight: 600 }}>✅ PROXY (3013) • </span>
      ) : apiSource === 'direct' ? (
        <span style={{ color: '#93c5fd', fontWeight: 600 }}>✅ DIRECT API • </span>
      ) : null}
      <span style={{ color: '#b8a88a' }}>Last updated:</span> <span style={{ color: '#f5ead6' }}>{lastUpdate.toLocaleTimeString()}</span>
      <span style={{ margin: '0 8px', color: '#6b5a42' }}>•</span>
      <span style={{ color: '#f5ead6' }}>{itemsCount}</span> <span style={{ color: '#b8a88a' }}>items found</span>
      {availableGold && (
        <>
          <span style={{ margin: '0 8px', color: '#6b5a42' }}>•</span>
          <span style={{ color: '#b8a88a' }}>Budget:</span> <span style={{ color: '#93c5fd' }}>{formatGp(parseFloat(availableGold))}</span>
        </>
      )}
      {!usingSampleData && (
        <>
          <span style={{ margin: '0 8px', color: '#6b5a42' }}>•</span>
          <span style={{ color: '#b8a88a' }}>Auto-refresh 60s</span>
        </>
      )}
      {onRefresh && (
        <>
          <span style={{ margin: '0 8px', color: '#6b5a42' }}>•</span>
          <button className="btn" onClick={onRefresh} disabled={loading} style={{ padding: '4px 12px', fontSize: 12 }}>
            {loading ? '⟳ Loading...' : '⟳ Refresh'}
          </button>
        </>
      )}
    </div>
  );
}
