import React from 'react';

export default function Header() {
  return (
    <header style={{ textAlign: 'center', marginBottom: 30 }}>
      <div className="ornament" style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b7355', fontSize: 14, letterSpacing: 8 }}>→ → → → →</div>
      <h1 style={{
        fontSize: 44,
        fontWeight: 700,
        margin: '10px 0',
        background: 'linear-gradient(180deg, #f5ead6 0%, #d4a84b 50%, #a67c20 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: 4
      }}>
        Grand Exchange Flipper
      </h1>
      <p style={{ 
        fontFamily: '"Crimson Text", serif',
        fontSize: 18,
        color: '#d4c4a4',
        fontStyle: 'italic'
      }}>
        Real-time margin analysis with 2% GE tax calculation
      </p>
      <div style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b7355', fontSize: 14, letterSpacing: 8, marginTop: 10 }}>→ → → → →</div>
    </header>
  );
}
