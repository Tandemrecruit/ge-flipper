import React, { useState, useMemo } from 'react';
import { formatGp } from '../../utils/formatters';
import { calculateTax, netToGross } from '../../utils/calculations';

export default function EditBuyPriceModal({ flip, onClose, onConfirm }) {
  const isManualEntry = !flip.itemId;
  
  // Get per-item sell price for editing
  const getSellPricePerItem = () => {
    if (flip.netSellPrice && flip.quantity > 0) {
      return flip.netSellPrice / flip.quantity;
    } else if (flip.sellPrice && flip.quantity > 0) {
      const grossPerItem = flip.sellPrice / flip.quantity;
      const taxPerItem = calculateTax(grossPerItem);
      return grossPerItem - taxPerItem;
    }
    return null;
  };

  const initialSellPricePerItem = getSellPricePerItem();
  const initialSellPriceIsNet = flip.netSellPrice !== null && flip.netSellPrice !== undefined;

  const [itemName, setItemName] = useState(flip.itemName || '');
  const [itemId, setItemId] = useState(flip.itemId ? flip.itemId.toString() : '');
  const [buyPrice, setBuyPrice] = useState(flip.buyPrice.toString());
  const [quantity, setQuantity] = useState(flip.quantity.toString());
  const [sellPrice, setSellPrice] = useState(initialSellPricePerItem ? initialSellPricePerItem.toString() : '');
  const [sellPriceIsNet, setSellPriceIsNet] = useState(initialSellPriceIsNet);
  const [suggestedBuy, setSuggestedBuy] = useState(flip.suggestedBuy ? flip.suggestedBuy.toString() : '');
  const [suggestedSell, setSuggestedSell] = useState(flip.suggestedSell ? flip.suggestedSell.toString() : '');
  const [error, setError] = useState('');

  if (!flip) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const price = parseFloat(buyPrice);
    const qty = parseInt(quantity);

    if (!price || price <= 0) {
      setError('Please enter a valid buy price');
      return;
    }

    if (!qty || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (isManualEntry && !itemName.trim()) {
      setError('Please enter an item name');
      return;
    }

    // Build updates object
    const updates = {
      buyPrice: price,
      quantity: qty
    };

    // Add item name if manual entry
    if (isManualEntry) {
      updates.itemName = itemName.trim();
    }

    // Add item ID if provided
    if (itemId.trim()) {
      const parsedItemId = parseInt(itemId);
      if (!isNaN(parsedItemId)) {
        updates.itemId = parsedItemId;
      }
    } else if (isManualEntry) {
      updates.itemId = null;
    }

    // Handle sell price - only include if it changed
    const currentSellPriceStr = initialSellPricePerItem ? initialSellPricePerItem.toString() : '';
    if (sellPrice.trim() !== currentSellPriceStr || sellPriceIsNet !== initialSellPriceIsNet) {
      if (sellPrice.trim()) {
        const sellPriceValue = parseFloat(sellPrice);
        if (sellPriceValue > 0) {
          updates.sellPrice = sellPriceValue;
        } else {
          updates.sellPrice = null;
          updates.netSellPrice = null;
        }
      } else {
        updates.sellPrice = null;
        updates.netSellPrice = null;
      }
    }

    // Handle suggested prices - only include if they changed
    const currentSuggestedBuyStr = flip.suggestedBuy ? flip.suggestedBuy.toString() : '';
    if (suggestedBuy.trim() !== currentSuggestedBuyStr) {
      if (suggestedBuy.trim()) {
        const parsed = parseFloat(suggestedBuy);
        updates.suggestedBuy = isNaN(parsed) ? null : parsed;
      } else {
        updates.suggestedBuy = null;
      }
    }

    const currentSuggestedSellStr = flip.suggestedSell ? flip.suggestedSell.toString() : '';
    if (suggestedSell.trim() !== currentSuggestedSellStr) {
      if (suggestedSell.trim()) {
        const parsed = parseFloat(suggestedSell);
        updates.suggestedSell = isNaN(parsed) ? null : parsed;
      } else {
        updates.suggestedSell = null;
      }
    }

    onConfirm(flip.id, updates, sellPriceIsNet);
    onClose();
  };

  // Calculate preview values
  const previewValues = useMemo(() => {
    const newBuyPrice = parseFloat(buyPrice) || flip.buyPrice;
    const newQty = parseInt(quantity) || flip.quantity;
    const newSuggestedSell = suggestedSell.trim() ? parseFloat(suggestedSell) : (flip.suggestedSell || 0);
    
    let previewExpectedProfit = 0;
    let previewActualProfit = 0;
    let previewTotalCost = newBuyPrice * newQty;

    // Recalculate expected profit if we have a suggested sell price
    if (newSuggestedSell > 0) {
      previewExpectedProfit = (newSuggestedSell * newQty) - (newQty * newBuyPrice);
    } else {
      // For manual entries, scale expected profit proportionally
      const profitPerItem = flip.expectedProfit ? (flip.expectedProfit / flip.quantity) : 0;
      previewExpectedProfit = profitPerItem * newQty;
    }

    // Recalculate actual profit if sell price is provided
    if (sellPrice.trim()) {
      const sellPriceValue = parseFloat(sellPrice);
      if (sellPriceValue > 0) {
        let netSellPerItem, grossSellPerItem;
        if (sellPriceIsNet) {
          netSellPerItem = sellPriceValue;
          grossSellPerItem = netToGross(sellPriceValue);
        } else {
          grossSellPerItem = sellPriceValue;
          const taxPerItem = calculateTax(grossSellPerItem);
          netSellPerItem = grossSellPerItem - taxPerItem;
        }
        previewActualProfit = (netSellPerItem - newBuyPrice) * newQty;
      }
    } else if (flip.sellPrice || flip.netSellPrice) {
      // Use existing sell price but recalculate with new buy price/quantity
      let netSellPerItem = 0;
      if (flip.netSellPrice && flip.quantity > 0) {
        netSellPerItem = flip.netSellPrice / flip.quantity;
      } else if (flip.sellPrice && flip.quantity > 0) {
        const grossSellPerItem = flip.sellPrice / flip.quantity;
        const taxPerItem = calculateTax(grossSellPerItem);
        netSellPerItem = grossSellPerItem - taxPerItem;
      }
      previewActualProfit = (netSellPerItem - newBuyPrice) * newQty;
    }

    return {
      expectedProfit: previewExpectedProfit,
      actualProfit: previewActualProfit,
      totalCost: previewTotalCost
    };
  }, [buyPrice, quantity, sellPrice, sellPriceIsNet, suggestedSell, flip]);

  const hasChanges = useMemo(() => {
    return (
      (itemName !== (flip.itemName || '')) ||
      (itemId !== (flip.itemId ? flip.itemId.toString() : '')) ||
      (parseFloat(buyPrice) !== flip.buyPrice) ||
      (parseInt(quantity) !== flip.quantity) ||
      (sellPrice !== (initialSellPricePerItem ? initialSellPricePerItem.toString() : '')) ||
      (sellPriceIsNet !== initialSellPriceIsNet) ||
      (suggestedBuy !== (flip.suggestedBuy ? flip.suggestedBuy.toString() : '')) ||
      (suggestedSell !== (flip.suggestedSell ? flip.suggestedSell.toString() : ''))
    );
  }, [itemName, itemId, buyPrice, quantity, sellPrice, sellPriceIsNet, suggestedBuy, suggestedSell, flip, initialSellPricePerItem, initialSellPriceIsNet]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="gold-border" 
        style={{ 
          maxWidth: 600, 
          width: '90%', 
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
          background: 'linear-gradient(180deg, rgba(35,28,20,0.98) 0%, rgba(20,16,12,0.99) 100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: '#f5ead6' }}>
            Edit Flip: {flip.itemName}
          </h2>
          <button className="btn" onClick={onClose} style={{ padding: '4px 12px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {isManualEntry && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter item name"
                  className="input-field"
                  style={{ width: '100%', padding: '10px', fontSize: 16 }}
                  required
                  autoFocus
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
                Item ID {isManualEntry && '(optional)'}
              </label>
              <input
                type="number"
                value={itemId}
                onChange={(e) => {
                  setItemId(e.target.value);
                  setError('');
                }}
                placeholder="Item ID"
                min="0"
                step="1"
                className="input-field"
                style={{ width: '100%', padding: '10px', fontSize: 16 }}
                disabled={!isManualEntry}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
                Buy Price *
              </label>
              <input
                type="number"
                value={buyPrice}
                onChange={(e) => {
                  setBuyPrice(e.target.value);
                  setError('');
                }}
                placeholder="Enter buy price"
                min="0"
                step="0.01"
                className="input-field"
                style={{ width: '100%', padding: '10px', fontSize: 16 }}
                required
                autoFocus={!isManualEntry}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                placeholder="Enter quantity"
                min="1"
                step="1"
                className="input-field"
                style={{ width: '100%', padding: '10px', fontSize: 16 }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
                Suggested Buy Price
              </label>
              <input
                type="number"
                value={suggestedBuy}
                onChange={(e) => {
                  setSuggestedBuy(e.target.value);
                  setError('');
                }}
                placeholder="Suggested buy"
                min="0"
                step="0.01"
                className="input-field"
                style={{ width: '100%', padding: '10px', fontSize: 16 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
                Suggested Sell Price
              </label>
              <input
                type="number"
                value={suggestedSell}
                onChange={(e) => {
                  setSuggestedSell(e.target.value);
                  setError('');
                }}
                placeholder="Suggested sell"
                min="0"
                step="0.01"
                className="input-field"
                style={{ width: '100%', padding: '10px', fontSize: 16 }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', color: '#d4a84b', fontSize: 13, marginBottom: 8 }}>
                Sell Price (per item) {sellPriceIsNet && <span style={{ fontSize: 11, color: '#6ee7a0' }}>(net)</span>}
                {!sellPriceIsNet && <span style={{ fontSize: 11, color: '#fbbf24' }}>(gross)</span>}
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => {
                    setSellPrice(e.target.value);
                    setError('');
                  }}
                  placeholder="Leave empty to clear sale"
                  min="0"
                  step="0.01"
                  className="input-field"
                  style={{ flex: 1, padding: '10px', fontSize: 16 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d4a84b', whiteSpace: 'nowrap' }}>
                  <input
                    type="checkbox"
                    checked={sellPriceIsNet}
                    onChange={(e) => setSellPriceIsNet(e.target.checked)}
                    style={{ width: 14, height: 14 }}
                  />
                  Net price
                </label>
              </div>
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

          {hasChanges && !error && (
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: 'rgba(74, 222, 128, 0.1)', 
              borderRadius: 8,
              border: '1px solid rgba(74, 222, 128, 0.3)'
            }}>
              <div style={{ color: '#d4a84b', fontSize: 12, marginBottom: 8 }}>Updated Calculations</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 14 }}>
                <div>
                  <div style={{ color: '#9e9e9e', fontSize: 11 }}>Total Cost</div>
                  <div style={{ 
                    color: '#f5ead6', 
                    fontWeight: 600,
                    fontSize: 16
                  }}>
                    {formatGp(previewValues.totalCost)}
                  </div>
                </div>
                {(suggestedSell.trim() || flip.suggestedSell) && (
                  <div>
                    <div style={{ color: '#9e9e9e', fontSize: 11 }}>Expected Profit</div>
                    <div style={{ 
                      color: previewValues.expectedProfit >= 0 ? '#4caf50' : '#f44336', 
                      fontWeight: 600,
                      fontSize: 16
                    }}>
                      {previewValues.expectedProfit >= 0 ? '+' : ''}{formatGp(previewValues.expectedProfit)}
                    </div>
                  </div>
                )}
                {(sellPrice.trim() || flip.sellPrice || flip.netSellPrice) && (
                  <div>
                    <div style={{ color: '#9e9e9e', fontSize: 11 }}>Actual Profit</div>
                    <div style={{ 
                      color: previewValues.actualProfit >= 0 ? '#4caf50' : '#f44336', 
                      fontWeight: 600,
                      fontSize: 16
                    }}>
                      {previewValues.actualProfit >= 0 ? '+' : ''}{formatGp(previewValues.actualProfit)}
                    </div>
                  </div>
                )}
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
              Update Flip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
