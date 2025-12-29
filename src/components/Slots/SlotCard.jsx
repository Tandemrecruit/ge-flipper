import React from 'react';
import { formatNumber, formatGp } from '../../utils/formatters';
import { getItemIconUrl } from '../../utils/iconUrl';

export default function SlotCard({ slot, onUpdateQuantity, onChangeType, onClear, onTrackFlip }) {
  if (!slot) return null;
  
  return (
    <div className={`slot-card slot-${slot.type || 'medium'}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 15, color: '#6b5a42' }}>Slot {slot.id || '?'}</span>
          <span className={`slot-type-badge slot-type-${slot.type || 'medium'}`} style={{ marginLeft: 8 }}>{slot.label || 'Unknown'}</span>
        </div>
        <select
          value={slot.type}
          onChange={(e) => onChangeType(slot.id, e.target.value)}
          className="input-field"
          style={{ padding: '4px 8px', fontSize: 14 }}
        >
          <option value="liquid">Liquid</option>
          <option value="medium">Medium</option>
          <option value="opportunity">Opportunity</option>
        </select>
      </div>
      
      {slot.item && slot.item !== null && (slot.item.id || slot.item.name) ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <img 
              src={getItemIconUrl(slot.item)}
              alt=""
              style={{ width: 32, height: 32, objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <div style={{ fontWeight: 600, fontFamily: '"Cinzel", serif' }}>{slot.item.name || 'Unknown Item'}</div>
              <div style={{ fontSize: 14, color: '#6b5a42' }}>
                {slot.item.isVeryHighVolume ? '⚡ Fast' : slot.item.isHighVolume ? '💧 Liquid' : '🐢 Slow'} • {formatNumber(slot.item.volume || 0)}/day
              </div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', marginBottom: 8, border: '1px solid #3d3225' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, color: '#6b5a42' }}>🔒 Locked Quantity:</span>
              <span style={{ fontSize: 13, color: '#6ee7a0' }}>click to edit</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  className="input-field"
                  value={slot.item.recommendedQty || 0}
                  onChange={(e) => onUpdateQuantity(slot.id, e.target.value)}
                  min="0"
                  max={slot.item.buyLimit || 99999}
                  style={{ 
                    width: 80, 
                    padding: '4px 8px', 
                    fontSize: 20, 
                    fontWeight: 700, 
                    textAlign: 'center',
                    color: slot.item.recommendedQty === 0 ? '#fca5a5' : '#d4a84b',
                    background: 'rgba(0,0,0,0.4)'
                  }}
                />
                <span style={{ fontSize: 15, color: '#6b5a42' }}>/ {(slot.item.buyLimit || 0).toLocaleString()}</span>
              </div>
              <span style={{ fontSize: 15, color: '#8b7355' }}>
                Cost: <span style={{ color: '#f5ead6', fontWeight: 600 }}>{formatGp(slot.item.totalCost || 0)}</span>
              </span>
            </div>
            {slot.item.recommendedQty === 0 && (
              <div style={{ fontSize: 14, color: '#fca5a5', marginTop: 4 }}>
                ⚡ Set quantity to calculate profit
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 15, marginBottom: 8 }}>
            <div>
              <span style={{ color: '#6b5a42' }}>Buy:</span> <span style={{ color: '#60a5fa' }}>{formatGp(slot.item.suggestedBuy || slot.item.buyPrice || 0)}</span>
            </div>
            <div>
              <span style={{ color: '#6b5a42' }}>Sell:</span> <span style={{ color: '#fbbf24' }}>{formatGp(slot.item.suggestedSell || slot.item.sellPrice || 0)}</span>
            </div>
            <div>
              <span style={{ color: '#6b5a42' }}>Per item:</span> <span className={(slot.item.suggestedProfit || slot.item.netProfit || 0) > 0 ? "profit-positive" : "profit-negative"}>
                {(slot.item.suggestedProfit || slot.item.netProfit || 0) > 0 ? '+' : ''}{formatGp(slot.item.suggestedProfit || slot.item.netProfit || 0)}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b5a42' }}>Total:</span> <span className={(slot.item.potentialProfit || 0) > 0 ? "profit-positive" : "profit-negative"} style={{ fontWeight: 600 }}>
                {(slot.item.potentialProfit || 0) > 0 ? '+' : ''}{formatGp(slot.item.potentialProfit || ((slot.item.suggestedProfit || slot.item.netProfit || 0) * (slot.item.recommendedQty || 1)))}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn" 
              onClick={() => {
                if (slot.item && onTrackFlip) {
                  onTrackFlip(slot.item);
                }
              }}
              style={{ flex: 1, padding: '6px', fontSize: 14, background: 'linear-gradient(180deg, #2d4a35 0%, #1d3225 100%)' }}
            >
              📊 Track Flip
            </button>
            <button 
              className="btn" 
              onClick={() => {
                if (slot.id && onClear) {
                  onClear(slot.id);
                }
              }}
              style={{ padding: '6px 12px', fontSize: 14, background: 'rgba(220, 38, 38, 0.3)' }}
              title="Clear slot"
            >
              ✔
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#5a4a35' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 15 }}>Empty slot</div>
          <div style={{ fontSize: 14, color: '#4a3a25', marginTop: 4 }}>
            Assign from Item Finder or suggestions below
          </div>
        </div>
      )}
    </div>
  );
}
