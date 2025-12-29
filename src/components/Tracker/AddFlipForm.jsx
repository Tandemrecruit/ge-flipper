import React, { useMemo } from 'react';
import { formatGp } from '../../utils/formatters';
import { calculateTax } from '../../utils/calculations';

export default function AddFlipForm({ newFlip, setNewFlip, onSave, onCancel }) {
  const isManualEntry = !newFlip.itemId;
  
  // Calculate live expected profit for manual entries
  const liveExpectedProfit = useMemo(() => {
    if (!isManualEntry) return newFlip.expectedProfit;
    
    const buy = parseFloat(newFlip.buyPrice) || 0;
    const targetSell = newFlip.suggestedSell || 0;
    const qty = parseInt(newFlip.quantity) || 1;
    
    if (targetSell > 0 && buy > 0) {
      // Expected profit = (netSellPrice - buyPrice) * quantity
      // where netSellPrice = targetSell - tax
      const taxPerItem = calculateTax(targetSell);
      const netSell = targetSell - taxPerItem;
      return (netSell - buy) * qty;
    }
    return 0;
  }, [isManualEntry, newFlip.buyPrice, newFlip.suggestedSell, newFlip.quantity, newFlip.expectedProfit]);

  return (
    <div style={{ background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: '#60a5fa' }}>
          {isManualEntry ? 'Add New Flip Entry' : `New Flip: ${newFlip.itemName}`}
        </span>
        {newFlip.suggestedSell > 0 && (
          <span style={{ fontSize: 16, color: '#fbbf24' }}>
            Target sell: <strong>{formatGp(newFlip.suggestedSell)}</strong>
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {isManualEntry && (
          <div>
            <label style={{ display: 'block', fontSize: 14, color: '#8b7355', marginBottom: 4 }}>Item Name *</label>
            <input
              type="text"
              className="input-field"
              value={newFlip.itemName}
              onChange={(e) => setNewFlip(prev => ({ ...prev, itemName: e.target.value }))}
              placeholder="Enter item name"
              style={{ width: 200 }}
            />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: 14, color: '#8b7355', marginBottom: 4 }}>Buy Price *</label>
          <input
            type="number"
            className="input-field"
            value={newFlip.buyPrice}
            onChange={(e) => setNewFlip(prev => ({ ...prev, buyPrice: e.target.value }))}
            placeholder="Buy price"
            style={{ width: 120 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 14, color: '#8b7355', marginBottom: 4 }}>Quantity *</label>
          <input
            type="number"
            className="input-field"
            value={newFlip.quantity}
            onChange={(e) => setNewFlip(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="1"
            style={{ width: 80 }}
          />
        </div>
        {isManualEntry && (
          <div>
            <label style={{ display: 'block', fontSize: 14, color: '#8b7355', marginBottom: 4 }}>
              Target Sell Price
              <span style={{ marginLeft: 6, fontSize: 13, color: '#fbbf24' }}>(for expected)</span>
            </label>
            <input
              type="number"
              className="input-field"
              value={newFlip.suggestedSell !== undefined && newFlip.suggestedSell !== null && newFlip.suggestedSell !== '' ? newFlip.suggestedSell : ''}
              onChange={(e) => {
                const value = e.target.value;
                // Parse the value - if empty string, set to 0, otherwise parse as float
                let numValue = 0;
                if (value !== '' && value != null) {
                  const parsed = parseFloat(value);
                  numValue = isNaN(parsed) ? 0 : parsed;
                }
                setNewFlip(prev => ({ ...prev, suggestedSell: numValue }));
              }}
              placeholder="Expected sell"
              style={{ width: 120 }}
            />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: 14, color: '#8b7355', marginBottom: 4 }}>
            Actual Sell (optional)
            <span style={{ marginLeft: 6, fontSize: 13, color: newFlip.sellPriceIsNet ? '#6ee7a0' : '#fbbf24' }}>
              {newFlip.sellPriceIsNet ? '(net)' : '(gross)'}
            </span>
          </label>
          <input
            type="number"
            className="input-field"
            value={newFlip.sellPrice}
            onChange={(e) => setNewFlip(prev => ({ ...prev, sellPrice: e.target.value }))}
            placeholder="From GE history"
            style={{ width: 140 }}
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#8b7355', marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={newFlip.sellPriceIsNet}
              onChange={(e) => setNewFlip(prev => ({ ...prev, sellPriceIsNet: e.target.checked }))}
              style={{ width: 14, height: 14 }}
            />
            Price is net (from GE history)
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onSave} style={{ padding: '8px 16px' }}>Save</button>
          {!isManualEntry && (
            <button className="btn" onClick={onCancel} style={{ padding: '8px 16px', background: 'rgba(220, 38, 38, 0.3)' }}>Cancel</button>
          )}
        </div>
      </div>
      {liveExpectedProfit !== 0 && (
        <div style={{ marginTop: 12, fontSize: 16, color: liveExpectedProfit > 0 ? '#6ee7a0' : '#f87171' }}>
          Expected profit: <strong>{liveExpectedProfit > 0 ? '+' : ''}{formatGp(liveExpectedProfit)}</strong>
          {isManualEntry && liveExpectedProfit > 0 && (
            <span style={{ marginLeft: 8, fontSize: 14, color: '#8b7355' }}>(after 2% tax)</span>
          )}
        </div>
      )}
    </div>
  );
}
