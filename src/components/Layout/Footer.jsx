import React from 'react';

export default function Footer() {
  return (
    <footer style={{ 
      textAlign: 'center', 
      marginTop: 30, 
      padding: 24,
      color: '#b8a88a',
      fontFamily: '"Crimson Text", serif',
      fontSize: 14
    }}>
      <div style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5a42', fontSize: 14, letterSpacing: 8 }}>→ → →</div>
      <p style={{ margin: '12px 0' }}>
        Data from OSRS Wiki Prices API • Tax: 2% (max 5M) • Prices update every minute
      </p>
      <p style={{ margin: 0, fontStyle: 'italic', color: '#9a8a6a' }}>
        "Buy low, sell high, and may your margins be ever profitable."
      </p>
    </footer>
  );
}
