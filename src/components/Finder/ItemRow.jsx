import React from 'react';
import { formatNumber, formatGp } from '../../utils/formatters';

export default function ItemRow({ item, idx, onItemClick, onTrackFlip, onAssignToSlot, availableSlots }) {
  const profitPerHour = item.estimatedProfitPerHour != null ? Math.round(item.estimatedProfitPerHour) : null;

  return (
    <tr 
      className="item-row"
      onClick={() => onItemClick(item)}
      style={{ 
        background: idx % 2 === 0 ? 'transparent' : 'rgba(90, 74, 53, 0.2)',
        fontFamily: '"Crimson Text", serif',
        fontSize: 15
      }}
    >
      <td style={{ padding: '14px', borderBottom: '1px solid rgba(90, 74, 53, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={item.icon} alt={item.name} style={{ width: 30, height: 30 }} />
          <div>
            <div style={{ fontWeight: 600, color: '#f5ead6', fontSize: 16 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: item.isSafeFlip ? '#4ade80' : '#9a8a6a', marginTop: 2 }}>
              {item.isSafeFlip ? '✅ SAFE' : (item.isManipulated ? '⚠️ risk' : '•')}
              {' '}
              {item.freshnessStatus === 'fresh' ? 'fresh' : 'stale'}
              {' • '}
              {item.liquidityTier}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '14px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.4)' }}>
        <div style={{ fontWeight: 600, color: '#f5ead6', fontSize: 16 }}>
          {formatNumber(item.volume)}
        </div>
        <div style={{ fontSize: 12, marginTop: 2, color: item.buyLimit >= 1000 ? '#6ee7a0' : item.buyLimit >= 100 ? '#fcd34d' : '#fca5a5' }}>
          Limit: {item.buyLimit?.toLocaleString() || '?'}
        </div>
      </td>
      <td style={{ padding: '14px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.4)', color: '#f5ead6' }}>
        {formatGp(item.buyPrice)}
      </td>
      <td style={{ padding: '14px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.4)', color: '#f5ead6' }}>
        {formatGp(item.sellPrice)}
      </td>
      <td style={{ padding: '14px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.4)' }}>
        <span className={`margin-${item.marginHealth}`} style={{ fontSize: 16, fontWeight: 600 }}>
          {item.spreadPercent.toFixed(1)}%
        </span>
        <div style={{ fontSize: 12, color: '#9a8a6a', marginTop: 2 }}>
          {item.marginHealth === 'healthy' ? '✅ good buffer' : item.marginHealth === 'thin' ? '⚡ thin' : '⚡ risky'}
        </div>
      </td>
      <td style={{ padding: '14px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.4)' }}>
        <span className={item.suggestedProfit > 0 ? 'profit-positive' : 'profit-negative'} style={{ fontSize: 16, fontWeight: 600 }}>
          +{formatGp(item.suggestedProfit)}
        </span>
        <div style={{ fontSize: 12, color: '#9a8a6a', marginTop: 2 }}>
          -{formatGp(item.suggestedTax)} tax • buffer {formatGp(item.slippageBufferGp)}
        </div>
        {profitPerHour != null && (
          <div style={{ fontSize: 11, color: '#7c6a4d', marginTop: 2 }}>
            ~{formatGp(profitPerHour)}/hr @ {item.recommendedQty.toLocaleString()} qty
          </div>
        )}
      </td>
      <td style={{ padding: '14px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.4)', color: '#93c5fd', fontWeight: 600 }}>
        {formatGp(item.suggestedBuy)}
      </td>
      <td style={{ padding: '14px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.4)', color: '#fde68a', fontWeight: 600 }}>
        {formatGp(item.suggestedSell)}
      </td>
      <td style={{ padding: '14px', textAlign: 'center', borderBottom: '1px solid rgba(90, 74, 53, 0.4)' }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <button 
            className="btn"
            onClick={(e) => { e.stopPropagation(); onTrackFlip(item); }}
            style={{ padding: '6px 10px', fontSize: 13 }}
            title="Track this flip"
          >
            📊
          </button>
          {availableSlots && availableSlots.length > 0 && (
            <select
              className="input-field"
              style={{ padding: '6px', fontSize: 13, width: 65 }}
              defaultValue=""
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (e.target.value) {
                  const slotId = parseInt(e.target.value);
                  onAssignToSlot(slotId, item);
                  e.target.value = '';
                }
              }}
            >
              <option value="">+ Slot</option>
              {availableSlots.map(slot => (
                <option key={slot.id} value={slot.id}>S{slot.id}</option>
              ))}
            </select>
          )}
        </div>
      </td>
    </tr>
  );
}
