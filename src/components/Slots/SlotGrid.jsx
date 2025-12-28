import React from 'react';
import SlotCard from './SlotCard';

export default function SlotGrid({ slots, onUpdateQuantity, onChangeType, onClear, onTrackFlip }) {
  if (!slots || !Array.isArray(slots)) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#8b7355' }}>No slots available</div>;
  }
  
  const validSlots = slots.filter(slot => slot && slot.id);
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
      {validSlots.map(slot => (
        <SlotCard
          key={slot.id}
          slot={slot}
          onUpdateQuantity={onUpdateQuantity}
          onChangeType={onChangeType}
          onClear={onClear}
          onTrackFlip={onTrackFlip}
        />
      ))}
    </div>
  );
}
