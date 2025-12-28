import React from 'react';
import FlipRow from './FlipRow';

export default function FlipList({ flipLog, onUpdateSale, onDelete, onEdit, onSplitSale }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
        <thead>
          <tr style={{ background: 'rgba(90, 74, 53, 0.6)' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>Item</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>Buy</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>Sell</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>Qty</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>Expected</th>
            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>Actual</th>
            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 16, fontWeight: 600 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flipLog.map(flip => (
            <FlipRow
              key={flip.id}
              flip={flip}
              onUpdateSale={onUpdateSale}
              onDelete={onDelete}
              onEdit={onEdit}
              onSplitSale={onSplitSale}
            />
          ))}
        </tbody>
      </table>
      {flipLog.length === 0 && (
        <div style={{ padding: 50, textAlign: 'center', color: '#d4c4a4', fontSize: 16 }}>
          No flips tracked yet. Add one from the Item Finder!
        </div>
      )}
    </div>
  );
}
