import React from 'react';
import { formatGp } from '../../utils/formatters';

export default function FlipStats({ flipStats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
      <div className="detail-box" style={{ textAlign: 'center' }}>
        <div className="detail-label">Completed</div>
        <div className="detail-value">{flipStats.completed}</div>
      </div>
      <div className="detail-box" style={{ textAlign: 'center' }}>
        <div className="detail-label">Pending</div>
        <div className="detail-value" style={{ color: '#fbbf24' }}>{flipStats.pending}</div>
      </div>
      <div className="detail-box" style={{ textAlign: 'center' }}>
        <div className="detail-label">Expected</div>
        <div className="detail-value" style={{ color: '#8b7355' }}>{formatGp(flipStats.totalExpected)}</div>
      </div>
      <div className="detail-box" style={{ textAlign: 'center' }}>
        <div className="detail-label">Actual Profit</div>
        <div className="detail-value profit-positive">{formatGp(flipStats.totalActual)}</div>
      </div>
      <div className="detail-box" style={{ textAlign: 'center' }}>
        <div className="detail-label">Tax Paid</div>
        <div className="detail-value" style={{ color: '#f87171' }}>{formatGp(flipStats.totalTax)}</div>
      </div>
      <div className="detail-box" style={{ textAlign: 'center' }}>
        <div className="detail-label">Win Rate</div>
        <div className="detail-value" style={{ color: flipStats.winRate >= 50 ? '#4ade80' : '#f87171' }}>{flipStats.winRate.toFixed(0)}%</div>
      </div>
    </div>
  );
}
