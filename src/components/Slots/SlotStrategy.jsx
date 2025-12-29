import React from 'react';

export default function SlotStrategy() {
  return (
    <div style={{ marginBottom: 24, padding: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid #5a4a35' }}>
      <h3 style={{ margin: '0 0 12px 0', color: '#d4a84b' }}>📦 Slot Allocation Strategy</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 16, fontFamily: '"Crimson Text", serif' }}>
        <div>
          <span className="slot-type-badge slot-type-liquid">5 Liquid Staples</span>
          <p style={{ margin: '8px 0 0 0', color: '#8b7355' }}>Fast fills, smaller margins. Your bread & butter.</p>
        </div>
        <div>
          <span className="slot-type-badge slot-type-medium">2 Medium Margin</span>
          <p style={{ margin: '8px 0 0 0', color: '#8b7355' }}>Slower flips, higher profit per slot.</p>
        </div>
        <div>
          <span className="slot-type-badge slot-type-opportunity">1 Opportunity</span>
          <p style={{ margin: '8px 0 0 0', color: '#8b7355' }}>Open for opportunities or emergency liquidity.</p>
        </div>
      </div>
    </div>
  );
}
