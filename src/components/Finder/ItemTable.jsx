import React from 'react';
import ItemRow from './ItemRow';

const SortIcon = ({ field, sortBy, sortAsc }) => (
  <span style={{ marginLeft: 4, opacity: sortBy === field ? 1 : 0.3 }}>
    {sortBy === field ? (sortAsc ? '▲' : '▼') : '→'}
  </span>
);

export default function ItemTable({ items, loading, sortBy, sortAsc, onSort, onItemClick, onTrackFlip, onAssignToSlot, availableSlots }) {
  return (
    <div className="gold-border" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr style={{ background: 'rgba(90, 74, 53, 0.6)' }}>
              <th style={{ padding: '16px 14px', textAlign: 'left', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 14, fontWeight: 600 }}>Item</th>
              <th className="th-cell" onClick={() => onSort('volume')} style={{ padding: '16px 14px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 14, fontWeight: 600 }}>
                Vol / Limit<SortIcon field="volume" sortBy={sortBy} sortAsc={sortAsc} />
              </th>
              <th className="th-cell" onClick={() => onSort('buyPrice')} style={{ padding: '16px 14px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 14, fontWeight: 600 }}>
                Low<SortIcon field="buyPrice" sortBy={sortBy} sortAsc={sortAsc} />
              </th>
              <th className="th-cell" onClick={() => onSort('sellPrice')} style={{ padding: '16px 14px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 14, fontWeight: 600 }}>
                High<SortIcon field="sellPrice" sortBy={sortBy} sortAsc={sortAsc} />
              </th>
              <th className="th-cell" onClick={() => onSort('spreadPercent')} style={{ padding: '16px 14px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 14, fontWeight: 600 }}>
                Spread<SortIcon field="spreadPercent" sortBy={sortBy} sortAsc={sortAsc} />
              </th>
              <th className="th-cell" onClick={() => onSort('netProfit')} style={{ padding: '16px 14px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 14, fontWeight: 600 }}>
                Profit<SortIcon field="netProfit" sortBy={sortBy} sortAsc={sortAsc} />
              </th>
              <th style={{ padding: '16px 14px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#93c5fd', fontSize: 14, fontWeight: 600 }}>Suggested Buy</th>
              <th style={{ padding: '16px 14px', textAlign: 'right', borderBottom: '2px solid #6b5a42', color: '#fde68a', fontSize: 14, fontWeight: 600 }}>Suggested Sell</th>
              <th style={{ padding: '16px 14px', textAlign: 'center', borderBottom: '2px solid #6b5a42', color: '#f5ead6', fontSize: 14, fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                idx={idx}
                onItemClick={onItemClick}
                onTrackFlip={onTrackFlip}
                onAssignToSlot={onAssignToSlot}
                availableSlots={availableSlots}
              />
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && !loading && (
          <div style={{ padding: 50, textAlign: 'center', color: '#d4c4a4', fontSize: 16 }}>
            No items match your criteria. Try adjusting the filters.
          </div>
        )}
      </div>
    </div>
  );
}
