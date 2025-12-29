import React from 'react';
import { formatNumber, formatGp } from '../../utils/formatters';
import { calculateTax } from '../../utils/calculations';
import { getItemIconUrl } from '../../utils/iconUrl';

export default function ItemDetailModal({ item, onClose, onTrackFlip, onAssignToSlot, availableSlots, availableGold }) {
  if (!item) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="gold-border" 
        style={{ 
          maxWidth: 600, 
          width: '90%', 
          maxHeight: '80vh', 
          overflowY: 'auto', 
          padding: 24,
          background: 'linear-gradient(180deg, rgba(35,28,20,0.98) 0%, rgba(20,16,12,0.99) 100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img 
              src={getItemIconUrl(item)}
              alt=""
              style={{ width: 48, height: 48, objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }} className="gold-glow">
                {item.name}
              </h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {item.isSafeFlip && <span className="tag tag-safe">Safe Flip</span>}
                {item.isVeryHighVolume ? <span className="tag tag-fastvol">Fast</span> : item.isHighVolume && <span className="tag tag-highvol">High Volume</span>}
                {item.members && <span className="tag tag-members">Members</span>}
                <span style={{ 
                  padding: '3px 10px', 
                  borderRadius: 3, 
                  fontSize: 12, 
                  fontWeight: 600,
                  background: item.buyLimit >= 1000 ? 'rgba(74, 222, 128, 0.25)' : item.buyLimit >= 100 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(248, 113, 113, 0.25)',
                  color: item.buyLimit >= 1000 ? '#6ee7a0' : item.buyLimit >= 100 ? '#fcd34d' : '#fca5a5',
                  border: `1px solid ${item.buyLimit >= 1000 ? 'rgba(74, 222, 128, 0.5)' : item.buyLimit >= 100 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(248, 113, 113, 0.5)'}`
                }}>
                  LIMIT: {item.buyLimit?.toLocaleString() || '?'}
                </span>
              </div>
              {item.buyLimit && item.buyLimit < 100 && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#fca5a5', fontFamily: '"Crimson Text", serif' }}>
                  ⚡ Low buy limit — max {item.buyLimit} items per 4 hours
                </div>
              )}
            </div>
          </div>
          <button 
            className="btn"
            onClick={onClose}
            style={{ padding: '4px 12px' }}
          >
            ✔
          </button>
        </div>

        <div className="ornament" style={{ marginBottom: 20 }}>→ → →</div>

        <div className="detail-grid">
          <div className="detail-box">
            <div className="detail-label">Low</div>
            <div className="detail-value">{formatGp(item.buyPrice)}</div>
            {item.avgBuyPrice && (
              <div style={{ fontSize: 13, color: '#93c5fd', marginTop: 4 }}>
                5m avg: {formatGp(item.avgBuyPrice)}
              </div>
            )}
          </div>
          <div className="detail-box">
            <div className="detail-label">High</div>
            <div className="detail-value">{formatGp(item.sellPrice)}</div>
            {item.avgSellPrice && (
              <div style={{ fontSize: 13, color: '#fde68a', marginTop: 4 }}>
                5m avg: {formatGp(item.avgSellPrice)}
              </div>
            )}
          </div>
          <div className="detail-box">
            <div className="detail-label">Suggested Buy</div>
            <div className="detail-value" style={{ color: '#93c5fd' }}>{formatGp(item.suggestedBuy)}</div>
            <div style={{ fontSize: 12, color: '#8b7355', marginTop: 4 }}>
              {item.avgBuyPrice ? 'Based on 5m avg' : 'Based on instant price'}
            </div>
          </div>
          <div className="detail-box">
            <div className="detail-label">Suggested Sell</div>
            <div className="detail-value" style={{ color: '#fde68a' }}>{formatGp(item.suggestedSell)}</div>
            <div style={{ fontSize: 12, color: '#8b7355', marginTop: 4 }}>
              {item.avgSellPrice ? 'Based on 5m avg' : 'Based on instant price'}
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'rgba(74, 222, 128, 0.1)', 
          border: '1px solid rgba(74, 222, 128, 0.3)',
          padding: 20,
          marginTop: 20,
          textAlign: 'center'
        }}>
          <div className="detail-label">Net Profit Per Item (After 2% Tax)</div>
          <div className="detail-value profit-positive" style={{ fontSize: 28 }}>
            +{formatGp(item.suggestedProfit)}
          </div>
          <div style={{ fontSize: 14, color: '#8b7355', marginTop: 8 }}>
            Sell {formatGp(item.sellPrice)} × 0.98 = {formatGp(item.netProceeds)} net − {formatGp(item.buyPrice)} buy = {formatGp(item.netProfit)} profit
          </div>
        </div>

        {/* Spread Analysis */}
        <div style={{ 
          background: item.marginHealth === 'healthy' ? 'rgba(74, 222, 128, 0.1)' : item.marginHealth === 'thin' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          border: `1px solid ${item.marginHealth === 'healthy' ? 'rgba(74, 222, 128, 0.3)' : item.marginHealth === 'thin' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
          padding: 16,
          marginTop: 16,
          textAlign: 'center'
        }}>
          <div className="detail-label">Spread Analysis</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }} className={`margin-${item.marginHealth}`}>
                {item.spreadPercent.toFixed(2)}%
              </div>
              <div style={{ fontSize: 12, color: '#8b7355' }}>Current Spread</div>
            </div>
            <div style={{ fontSize: 24, color: '#5a4a35' }}>vs</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#8b7355' }}>
                2.04%
              </div>
              <div style={{ fontSize: 12, color: '#8b7355' }}>Break-even</div>
            </div>
            <div style={{ fontSize: 24, color: '#5a4a35' }}>→</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }} className={`margin-${item.marginHealth}`}>
                +{item.marginBuffer.toFixed(2)}%
              </div>
              <div style={{ fontSize: 12, color: '#8b7355' }}>Buffer</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: '#8b7355' }}>
            {item.isVeryHighVolume ? (
              <span>⚡ <strong>Very fast</strong> item — 2.5%+ spread acceptable</span>
            ) : item.isHighVolume ? (
              <span>💧 <strong>Liquid</strong> item — 3.5%+ spread recommended</span>
            ) : (
              <span>🐢 <strong>Slower</strong> item — 4.5%+ spread recommended for safety</span>
            )}
            {' '}(needs {item.minSpreadRequired}%, has {item.spreadPercent.toFixed(1)}%)
          </div>
        </div>

        <div className="detail-grid" style={{ marginTop: 20 }}>
          <div className="detail-box">
            <div className="detail-label">Spread %</div>
            <div className={`detail-value margin-${item.marginHealth}`}>{item.spreadPercent.toFixed(2)}%</div>
          </div>
          <div className="detail-box">
            <div className="detail-label">Daily Volume</div>
            <div className="detail-value" style={{ color: item.isVeryHighVolume ? '#c084fc' : item.isHighVolume ? '#a855f7' : '#e8d5b0' }}>{formatNumber(item.volume)}</div>
          </div>
          <div className="detail-box">
            <div className="detail-label">Buy Limit (4hr)</div>
            <div className="detail-value">{item.buyLimit?.toLocaleString() || '—'}</div>
          </div>
          <div className="detail-box">
            <div className="detail-label">Max Profit (at limit)</div>
            <div className="detail-value profit-positive">
              {item.buyLimit ? formatGp(item.suggestedProfit * item.buyLimit) : '—'}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button 
            className="btn"
            onClick={() => { onTrackFlip(item); onClose(); }}
            style={{ flex: 1, padding: '12px', fontSize: 16, background: 'linear-gradient(180deg, #2d4a35 0%, #1d3225 100%)' }}
          >
            📊 Track This Flip
          </button>
          {availableSlots && availableSlots.length > 0 && (
            <select
              className="input-field"
              style={{ padding: '12px', fontSize: 14 }}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value && onAssignToSlot) {
                  try {
                    const slotId = parseInt(e.target.value);
                    if (isNaN(slotId)) {
                      console.error('Invalid slot ID');
                      return;
                    }
                    
                    const slot = availableSlots?.find(s => s && s.id === slotId);
                    if (!slot) {
                      console.error('Slot not found:', slotId);
                      alert('Slot not found. Please try again.');
                      return;
                    }
                    
                    // Calculate suggested volume based on slot type
                    const userGold = availableGold ? parseFloat(availableGold) : null;
                    const costPerItem = item.suggestedBuy || item.buyPrice || 0;
                    const profitPerItem = item.suggestedProfit || item.netProfit || 0;
                    
                    if (costPerItem <= 0) {
                      console.error('Invalid cost per item:', costPerItem);
                      alert('Invalid item price. Cannot assign to slot.');
                      return;
                    }
                    
                    let suggestedPercent = slot.type === 'liquid' ? 0.8 : (slot.type === 'medium' ? 0.5 : 0.3);
                    let suggestedVol = Math.floor((item.buyLimit || 100) * suggestedPercent);
                    
                    if (userGold && !isNaN(userGold) && userGold > 0 && costPerItem > 0) {
                      const maxAffordable = Math.floor(userGold / costPerItem);
                      const maxForDiv = Math.floor((userGold * 0.3) / costPerItem);
                      suggestedVol = Math.min(suggestedVol, maxAffordable, maxForDiv);
                    }
                    suggestedVol = Math.max(1, suggestedVol);
                    
                    if (!onAssignToSlot || typeof onAssignToSlot !== 'function') {
                      console.error('onAssignToSlot is not a function');
                      return;
                    }
                    
                    onAssignToSlot(slotId, { 
                      ...item, 
                      recommendedQty: suggestedVol,
                      potentialProfit: suggestedVol * profitPerItem,
                      totalCost: suggestedVol * costPerItem
                    });
                    onClose();
                  } catch (error) {
                    console.error('Error assigning to slot:', error);
                    alert('Error assigning item to slot: ' + (error.message || 'Unknown error'));
                  }
                }
              }}
            >
              <option value="">📦 Assign to Slot</option>
              {availableSlots?.filter(s => !s.item || s.item === null).map(s => (
                <option key={s.id} value={s.id}>Slot {s.id} ({s.label || 'Unnamed'})</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ marginTop: 20, padding: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid #3d3225' }}>
          <div style={{ fontSize: 14, fontFamily: '"Crimson Text", serif', color: '#8b7355' }}>
            <strong style={{ color: '#e8d5b0' }}>💡 Flip Strategy:</strong> Place a buy offer at <span style={{ color: '#60a5fa' }}>{formatGp(item.suggestedBuy)}</span> and 
            wait for it to fill. Then immediately list at <span style={{ color: '#fbbf24' }}>{formatGp(item.suggestedSell)}</span>. 
            Expected profit: <span className="profit-positive">+{formatGp(item.suggestedProfit)}</span> per item after tax.
          </div>
        </div>

        {item.highTime && item.lowTime && (
          <div style={{ marginTop: 16, fontSize: 12, color: '#6b5a42', textAlign: 'center', fontFamily: '"Crimson Text", serif' }}>
            Last high: {item.highTime.toLocaleString()} • Last low: {item.lowTime.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
