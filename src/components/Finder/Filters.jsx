import React from 'react';
import StatusBar from '../Layout/StatusBar';

export default function Filters({ 
  filters, 
  onFiltersChange, 
  lastUpdate, 
  apiSource, 
  usingSampleData, 
  itemsCount, 
  onRefresh, 
  loading,
  availableGold: externalGold
}) {
  const { searchTerm, minProfit, minRoi, availableGold, showSafeOnly } = filters;

  const handleChange = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleGoldChange = (e) => {
    const val = e.target.value.replace(/[^0-9kmb.]/gi, '');
    handleChange('availableGold', val);
  };

  const handleGoldBlur = (e) => {
    let val = e.target.value.toLowerCase().trim();
    if (val.endsWith('b')) {
      handleChange('availableGold', String(parseFloat(val) * 1000000000));
    } else if (val.endsWith('m')) {
      handleChange('availableGold', String(parseFloat(val) * 1000000));
    } else if (val.endsWith('k')) {
      handleChange('availableGold', String(parseFloat(val) * 1000));
    }
  };

  return (
    <div className="gold-border" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 250px' }}>
          <label style={{ display: 'block', fontSize: 13, color: '#d4c4a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Search Items
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#d4c4a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Min Profit
          </label>
          <input
            type="number"
            className="input-field"
            value={minProfit}
            onChange={(e) => handleChange('minProfit', parseInt(e.target.value) || 0)}
            style={{ width: 130 }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#d4c4a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Min ROI %
          </label>
          <input
            type="number"
            className="input-field"
            value={minRoi}
            onChange={(e) => handleChange('minRoi', parseFloat(e.target.value) || 0)}
            step="0.5"
            style={{ width: 110 }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#d4c4a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            My Gold (gp)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 10m"
            value={availableGold}
            onChange={handleGoldChange}
            onBlur={handleGoldBlur}
            style={{ width: 150 }}
          />
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showSafeOnly}
              onChange={(e) => handleChange('showSafeOnly', e.target.checked)}
              style={{ width: 20, height: 20, accentColor: '#d4a84b' }}
            />
            <span style={{ fontSize: 15, color: '#f5ead6', fontWeight: 500 }}>Safe Flips Only</span>
          </label>
          {onRefresh && (
            <button className="btn" onClick={onRefresh} disabled={loading}>
              {loading ? '⟳ Loading...' : '⟳ Refresh'}
            </button>
          )}
        </div>
      </div>
      
      <StatusBar 
        lastUpdate={lastUpdate}
        apiSource={apiSource}
        usingSampleData={usingSampleData}
        itemsCount={itemsCount}
        availableGold={externalGold || availableGold}
      />
      
      {showSafeOnly && (
        <div className="info-banner info-banner-info" style={{ marginTop: 16 }}>
          <strong style={{ color: '#93c5fd', fontSize: 15 }}>🔒 Safe Flip Rules:</strong>
          <span style={{ marginLeft: 8 }}>Break-even = 2.04% spread.</span>
          <span style={{ marginLeft: 16, color: '#e9d5ff' }}>⚡ Fast (50K+/day):</span> <span style={{ color: '#f5ead6' }}>2.5%+ OK</span>
          <span style={{ marginLeft: 12 }}>•</span>
          <span style={{ marginLeft: 12, color: '#d8b4fe' }}>💧 Liquid:</span> <span style={{ color: '#f5ead6' }}>3.5%+</span>
          <span style={{ marginLeft: 12 }}>•</span>
          <span style={{ marginLeft: 12, color: '#d4c4a4' }}>🐢 Slow:</span> <span style={{ color: '#f5ead6' }}>4.5%+ recommended</span>
        </div>
      )}
    </div>
  );
}
