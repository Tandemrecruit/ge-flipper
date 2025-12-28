import React, { useState } from 'react';
import { formatGp } from '../../utils/formatters';
import { calculateTax, netToGross } from '../../utils/calculations';

export default function SplitSaleModal({ flip, onClose, onSplit }) {
  const [splitQty, setSplitQty] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [isNetPrice, setIsNetPrice] = useState(true);
  const [error, setError] = useState('');

  if (!flip) return null;

  const remainingQty = flip.quantity;
  const buyPrice = flip.buyPrice;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(splitQty);
    const price = parseFloat(sellPrice);

    if (!qty || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (qty > remainingQty) {
      setError(`Cannot split more than remaining quantity (${remainingQty})`);
      return;
    }

    if (!price || price <= 0) {
      setError('Please enter a valid sell price');
      return;
    }

    onSplit(flip.id, qty, price, isNetPrice);
    onClose();
  };

  // Calculate preview values
  let previewNetSell = 0;
  let previewGrossSell = 0;
  let previewTax = 0;
  let previewProfit = 0;

  if (sellPrice && splitQty) {
    const price = parseFloat(sellPrice);
    const qty = parseInt(splitQty);

    if (isNetPrice) {
      previewNetSell = price;
      previewGrossSell = netToGross(price);
      previewTax = (previewGrossSell - previewNetSell) * qty;
    } else {
      previewGrossSell = price;
      previewTax = calculateTax(price) * qty;
      previewNetSell = previewGrossSell - (previewTax / qty);
    }

    previewProfit = (previewNetSell - buyPrice) * qty;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="gold-border" 
        style={{ 
          maxWidth: 500, 
          width: '90%', 
          padding: 24,
          background: 'linear-gradient(180deg, rgba(35,28,20,0.98) 0%, rgba(20,16,12,0.99) 100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: '#f5ead6' }}>
            Split Sale: {flip.itemName}
          </h2>
          <button className="btn" onClick={onClose} style={{ padding: '4px 12px' }}>✕</button>
        </div>

        <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#1a1611', borderRadius: 8, border: '1px solid #3a3429' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
            <div>
              <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 4 }}>Remaining Quantity</div>
              <div style={{ color: '#f5ead6', fontSize: 18, fontWeight: 600 }}>{remainingQty.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 4 }}>Buy Price</div>
              <div style={{ color: '#f5ead6', fontSize: 18, fontWeight: 600 }}>{formatGp(buyPrice)}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
              Quantity to Split
            </label>
            <input
              type="number"
              value={splitQty}
              onChange={(e) => {
                setSplitQty(e.target.value);
                setError('');
              }}
              placeholder={`Max: ${remainingQty}`}
              min="1"
              max={remainingQty}
              className="input-field"
              style={{ width: '100%', padding: '10px', fontSize: 16 }}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
              Sell Price ({isNetPrice ? 'Net' : 'Gross'})
            </label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => {
                setSellPrice(e.target.value);
                setError('');
              }}
              placeholder="Enter sell price"
              min="0"
              step="0.01"
              className="input-field"
              style={{ width: '100%', padding: '10px', fontSize: 16 }}
              required
            />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="isNetPrice"
                checked={isNetPrice}
                onChange={(e) => setIsNetPrice(e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="isNetPrice" style={{ color: '#f5ead6', fontSize: 13, cursor: 'pointer' }}>
                Price is net (after tax, as shown in GE history)
              </label>
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: 12, 
              backgroundColor: 'rgba(220, 38, 38, 0.2)', 
              border: '1px solid rgba(220, 38, 38, 0.5)',
              borderRadius: 4,
              color: '#fca5a5',
              marginBottom: 16,
              fontSize: 13
            }}>
              {error}
            </div>
          )}

          {sellPrice && splitQty && !error && (
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'rgba(74, 222, 128, 0.1)', 
              borderRadius: 8,
              border: '1px solid rgba(74, 222, 128, 0.3)'
            }}>
              <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 8 }}>Preview</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <div>
                  <div style={{ color: '#9e9e9e', fontSize: 11 }}>Gross Sell Price</div>
                  <div style={{ color: '#f5ead6', fontWeight: 600 }}>{formatGp(previewGrossSell)}</div>
                </div>
                <div>
                  <div style={{ color: '#9e9e9e', fontSize: 11 }}>Net Sell Price</div>
                  <div style={{ color: '#f5ead6', fontWeight: 600 }}>{formatGp(previewNetSell)}</div>
                </div>
                <div>
                  <div style={{ color: '#9e9e9e', fontSize: 11 }}>Tax</div>
                  <div style={{ color: '#ff9800', fontWeight: 600 }}>-{formatGp(previewTax)}</div>
                </div>
                <div>
                  <div style={{ color: '#9e9e9e', fontSize: 11 }}>Profit</div>
                  <div style={{ 
                    color: previewProfit >= 0 ? '#4caf50' : '#f44336', 
                    fontWeight: 600,
                    fontSize: 16
                  }}>
                    {previewProfit >= 0 ? '+' : ''}{formatGp(previewProfit)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{ flex: 1, padding: '12px', fontSize: 16 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              style={{ 
                flex: 1, 
                padding: '12px', 
                fontSize: 16,
                backgroundColor: '#d4a84b',
                color: '#151210',
                fontWeight: 600
              }}
            >
              Split Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
