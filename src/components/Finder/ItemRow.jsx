import React from 'react';
import { formatNumber, formatGp } from '../../utils/formatters';

export default function ItemRow({ item, idx, onItemClick, onTrackFlip, onAssignToSlot, availableSlots }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img 
            src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon?.replace(/ /g, '_') || item.name.replace(/ /g, '_'))}.png`}
            alt=""
            style={{ width: 36, height: 36, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <div style={{ fontWeight: 600, fontFamily: '"Cinzel", serif', fontSize: 15, color: '#f5ead6' }}>{item.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              {item.isSafeFlip && <span className="tag tag-safe">Safe</span>}
              {item.isVeryHighVolume ? <span className="tag tag-fastvol">Fast</span> : item.isHighVolume && <span className="tag tag-highvol">Liquid</span>}
              {item.members && <span className="tag tag-members">P2P</span>}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '14px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.4)' }}>
        <div style={{ color: item.isVeryHighVolume ? '#e9d5ff' : item.isHighVolume ? '#d8b4fe' : '#b8a88a' }}>
          {formatNumber(item.volume)}/day
        </div>
        <div style={{ 
          fontSize: 12, 
          marginTop: 2,
          color: item.buyLimit >= 1000 ? '#6ee7a0' : item.buyLimit >= 100 ? '#fcd34d' : '#fca5a5'
        }}>
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
        <span className={item.netProfit > 0 ? 'profit-positive' : 'profit-negative'} style={{ fontSize: 16, fontWeight: 600 }}>
          +{formatGp(item.netProfit)}
        </span>
        <div style={{ fontSize: 12, color: '#9a8a6a', marginTop: 2 }}>-{formatGp(item.tax)} tax</div>
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
              {availableSlots.map(s => (
                <option key={s.id} value={s.id}>#{s.id}</option>
              ))}
            </select>
          )}
        </div>
      </td>
    </tr>
  );
}
