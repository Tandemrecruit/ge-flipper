import React from 'react';
import { formatGp } from '../../utils/formatters';

export default function FlipRow({ flip, onUpdateSale, onDelete, onEdit, onSplitSale }) {
  const isSplit = flip.splitFrom !== null && flip.splitFrom !== undefined;
  
  // For manual entries (no suggestedSell), display actual profit as expected
  // to avoid showing incorrect large negative values
  // However, if expectedProfit exists and was calculated from a target sell price,
  // always show expectedProfit (it will be non-zero if suggestedSell was provided)
  const isManualEntry = !flip.suggestedSell || flip.suggestedSell === 0;
  // Priority: 
  // 1. If suggestedSell exists and > 0, always show expectedProfit (even if 0, it was calculated)
  // 2. If expectedProfit exists and is not 0, use it (means user entered a target sell price)
  // 3. Otherwise, for true manual entries without target, show actual profit
  const displayExpected = (!isManualEntry && flip.expectedProfit != null)
    ? flip.expectedProfit
    : (flip.expectedProfit != null && flip.expectedProfit !== 0)
      ? flip.expectedProfit
      : (isManualEntry ? (flip.actualProfit || 0) : (flip.expectedProfit || 0));
  
  return (
    <tr style={{ 
      fontFamily: '"Crimson Text", serif', 
      fontSize: 17,
      backgroundColor: isSplit ? 'rgba(212, 168, 75, 0.05)' : 'transparent'
    }}>
      <td style={{ padding: '12px', borderBottom: '1px solid rgba(90, 74, 53, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSplit && (
            <span style={{ 
              fontSize: 15, 
              color: '#d4a84b',
              fontStyle: 'italic'
            }} title={`Split from flip #${flip.splitFrom}`}>
              ↳
            </span>
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#f5ead6', fontSize: 17 }}>{flip.itemName}</div>
            <div style={{ fontSize: 16, color: '#6b5a42', marginTop: 4 }}>
              {new Date(flip.date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.3)', fontSize: 17 }}>
        {formatGp(flip.buyPrice)}
      </td>
      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.3)', fontSize: 17 }}>
        {flip.sellPrice && flip.quantity > 0 ? formatGp(flip.sellPrice / flip.quantity) : '—'}
      </td>
      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.3)', fontSize: 17 }}>
        {flip.quantity}
      </td>
      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.3)', fontSize: 17 }}>
        <span className={displayExpected >= 0 ? 'profit-positive' : 'profit-negative'}>
          {displayExpected >= 0 ? '+' : ''}{formatGp(displayExpected)}
          {isManualEntry && <span style={{ fontSize: 14, color: '#8b7355', marginLeft: 4 }} title="Manual entry - showing actual profit">*</span>}
        </span>
      </td>
      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid rgba(90, 74, 53, 0.3)', fontSize: 17 }}>
        {flip.actualProfit !== null ? (
          <span className={flip.actualProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
            {flip.actualProfit >= 0 ? '+' : ''}{formatGp(flip.actualProfit)}
          </span>
        ) : '—'}
      </td>
      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid rgba(90, 74, 53, 0.3)' }}>
        <span style={{ 
          padding: '4px 10px', 
          borderRadius: 3, 
          fontSize: 16, 
          background: flip.status === 'complete' ? 'rgba(74, 222, 128, 0.25)' : 'rgba(251, 191, 36, 0.25)',
          color: flip.status === 'complete' ? '#6ee7a0' : '#fbbf24'
        }}>
          {flip.status === 'complete' ? '✓' : '⏳'}
        </span>
      </td>
      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid rgba(90, 74, 53, 0.3)' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {flip.status === 'pending' && (
            <>
              <button 
                className="btn" 
                onClick={() => onUpdateSale(flip.id)} 
                style={{ padding: '6px 12px', fontSize: 16 }}
                title="Mark entire quantity as sold"
              >
                Add Sale
              </button>
              <button 
                className="btn" 
                onClick={() => onSplitSale(flip.id)} 
                style={{ 
                  padding: '6px 12px', 
                  fontSize: 16,
                  background: 'rgba(212, 168, 75, 0.3)',
                  color: '#f5ead6'
                }}
                title="Split sale - record partial quantity at different price"
              >
                Split Sale
              </button>
            </>
          )}
          {flip.status === 'complete' && flip.splitFrom && (
            <span style={{ 
              fontSize: 14, 
              color: '#d4a84b',
              fontStyle: 'italic'
            }}>
              Split from #{flip.splitFrom}
            </span>
          )}
          <button 
            className="btn" 
            onClick={() => onEdit(flip.id)} 
            style={{ 
              padding: '6px 12px', 
              fontSize: 16,
              background: 'rgba(59, 130, 246, 0.3)',
              color: '#93c5fd'
            }}
            title="Edit buy price and quantity"
          >
            Edit
          </button>
          <button 
            className="btn" 
            onClick={() => onDelete(flip.id)} 
            style={{ 
              padding: '6px 12px', 
              fontSize: 16, 
              background: 'rgba(220, 38, 38, 0.3)',
              color: '#fca5a5'
            }}
            title="Delete this flip"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
