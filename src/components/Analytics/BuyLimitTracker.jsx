import React, { useState } from 'react';
import { useBuyLimitTracker } from '../../hooks/useBuyLimitTracker';

export default function BuyLimitTracker({ flipLog, mapping }) {
  const { buyLimits, getRemainingLimit, updatePurchased, getItemsWithLimits } = useBuyLimitTracker(flipLog, mapping);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const itemsWithLimits = getItemsWithLimits();
  const allItems = Object.values(buyLimits)
    .filter(limit => {
      if (!searchTerm) return true;
      const itemName = (limit.itemName || `Item ${limit.itemId}`).toLowerCase();
      return itemName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aRemaining = getRemainingLimit(a.itemId);
      const bRemaining = getRemainingLimit(b.itemId);
      return (bRemaining || 0) - (aRemaining || 0);
    });

  const handleManualUpdate = (itemId, quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty !== 0) {
      updatePurchased(itemId, qty);
    }
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 20 }}>
        🛒 Buy Limit Tracker
      </h3>
      <p style={{ color: '#d4a84b', fontSize: 13, marginBottom: 16 }}>
        Track remaining buy limits for items. Limits operate on a rolling 4-hour window.
      </p>

      {/* Search Input */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#d4c4a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
          Search Items
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: 400 }}
        />
      </div>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ 
          backgroundColor: '#1a1611', 
          padding: 16, 
          borderRadius: 8, 
          border: '1px solid #3a3429'
        }}>
          <div style={{ color: '#d4a84b', fontSize: 12 }}>Items Tracked</div>
          <div style={{ color: '#f5ead6', fontSize: 24, fontWeight: 600 }}>
            {allItems.length}
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#1a1611', 
          padding: 16, 
          borderRadius: 8, 
          border: '1px solid #3a3429'
        }}>
          <div style={{ color: '#d4a84b', fontSize: 12 }}>Available Limits</div>
          <div style={{ color: '#4caf50', fontSize: 24, fontWeight: 600 }}>
            {itemsWithLimits.reduce((sum, item) => sum + (item.remaining || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Items List */}
      <div style={{ display: 'grid', gap: 12 }}>
        {allItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#f5ead6' }}>
            No items tracked yet. Buy limits will be tracked automatically when you flip items.
          </div>
        ) : (
          allItems.map(limit => {
            const remaining = getRemainingLimit(limit.itemId);
            const used = remaining !== null ? limit.buyLimit - remaining : 0;
            const usagePercent = limit.buyLimit > 0 ? (used / limit.buyLimit) * 100 : 0;
            const isLow = remaining !== null && remaining < limit.buyLimit * 0.2;

            return (
              <div
                key={limit.itemId}
                style={{
                  backgroundColor: '#1a1611',
                  border: isLow ? '1px solid #f44336' : '1px solid #3a3429',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ color: '#f5ead6', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                    {limit.itemName || `Item ${limit.itemId}`}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: '#d4a84b', fontSize: 11 }}>Buy Limit</div>
                      <div style={{ color: '#f5ead6', fontSize: 14 }}>
                        {limit.buyLimit.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#d4a84b', fontSize: 11 }}>Purchased</div>
                      <div style={{ color: '#ff9800', fontSize: 14 }}>
                        {used.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#d4a84b', fontSize: 11 }}>Remaining</div>
                      <div style={{ 
                        color: remaining !== null && remaining > 0 ? '#4caf50' : '#f44336', 
                        fontSize: 14, 
                        fontWeight: 600 
                      }}>
                        {remaining !== null ? remaining.toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, width: '100%', maxWidth: 300 }}>
                    <div style={{ 
                      height: 6, 
                      backgroundColor: '#3a3429', 
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${usagePercent}%`,
                        backgroundColor: isLow ? '#f44336' : usagePercent > 80 ? '#ff9800' : '#4caf50',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="±Qty"
                    style={{
                      width: 80,
                      padding: '6px 8px',
                      backgroundColor: '#2a2419',
                      color: '#f5ead6',
                      border: '1px solid #d4a84b',
                      borderRadius: 4,
                      fontSize: 13
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleManualUpdate(limit.itemId, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    className="btn"
                    onClick={() => {
                      const qty = prompt(`Enter quantity to add/subtract for ${limit.itemName}:`, '0');
                      if (qty !== null) {
                        handleManualUpdate(limit.itemId, parseInt(qty) || 0);
                      }
                    }}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    Update
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
