import { useState, useEffect, useMemo } from 'react';

const DEFAULT_SLOTS = [
  { id: 1, type: 'liquid', item: null, label: 'Liquid Staple' },
  { id: 2, type: 'liquid', item: null, label: 'Liquid Staple' },
  { id: 3, type: 'liquid', item: null, label: 'Liquid Staple' },
  { id: 4, type: 'liquid', item: null, label: 'Liquid Staple' },
  { id: 5, type: 'liquid', item: null, label: 'Liquid Staple' },
  { id: 6, type: 'medium', item: null, label: 'Medium Margin' },
  { id: 7, type: 'medium', item: null, label: 'Medium Margin' },
  { id: 8, type: 'opportunity', item: null, label: 'Opportunity' },
];

export const useSlots = () => {
  const [slots, setSlots] = useState(() => {
    try {
      const saved = localStorage.getItem('ge-slot-allocation');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean up any slots with invalid item data (empty objects, etc.)
        return parsed.map(slot => ({
          ...slot,
          item: slot.item && slot.item !== null && (slot.item.id || slot.item.name) ? slot.item : null
        }));
      }
      return DEFAULT_SLOTS;
    } catch { 
      return DEFAULT_SLOTS; 
    }
  });

  // Save slots to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ge-slot-allocation', JSON.stringify(slots));
    } catch (err) {
      console.error('Failed to save slots:', err);
    }
  }, [slots]);

  const assignToSlot = (slotId, item) => {
    // Validate inputs
    if (!item || typeof item !== 'object') {
      console.error('assignToSlot: Invalid item provided', item);
      return;
    }
    
    if (!item.id && !item.name) {
      console.error('assignToSlot: Item must have id or name', item);
      return;
    }
    
    setSlots(prev => {
      let targetSlotId = slotId;
      
      // If slotId is null or undefined, find the first appropriate empty slot
      if (targetSlotId === null || targetSlotId === undefined) {
        // Determine appropriate slot type based on item characteristics
        let preferredType = 'medium'; // default
        if (item.isVeryHighVolume || item.isHighVolume) {
          preferredType = 'liquid';
        } else if (item.spreadPercent && item.spreadPercent >= 5) {
          preferredType = 'opportunity';
        }
        
        // Find first empty slot of preferred type
        const preferredSlot = prev.find(s => s.type === preferredType && !s.item);
        if (preferredSlot) {
          targetSlotId = preferredSlot.id;
        } else {
          // If no slot of preferred type, find any empty slot
          const anyEmptySlot = prev.find(s => !s.item);
          if (anyEmptySlot) {
            targetSlotId = anyEmptySlot.id;
          } else {
            // No empty slots available
            return prev;
          }
        }
      }
      
      // Ensure slotId is a number for comparison
      const targetSlotIdNum = typeof targetSlotId === 'string' ? parseInt(targetSlotId) : targetSlotId;
      
      if (isNaN(targetSlotIdNum)) {
        console.error('assignToSlot: Invalid slot ID', targetSlotId);
        return prev;
      }
      
      const updated = prev.map(slot => {
        // Ensure slot.id is compared as number
        const slotIdNum = typeof slot.id === 'string' ? parseInt(slot.id) : slot.id;
        
        if (slotIdNum === targetSlotIdNum) {
          // Calculate safe defaults for quantities and costs
          const recommendedQty = item.recommendedQty || item.suggestedVolume || item.buyLimit || 1;
          const profitPerItem = item.suggestedProfit || item.netProfit || 0;
          const costPerItem = item.suggestedBuy || item.buyPrice || 0;
          
          return { 
            ...slot, 
            item: {
              id: item.id || 0,
              name: item.name || 'Unknown Item',
              icon: item.icon || null,
              buyPrice: item.buyPrice || 0,
              sellPrice: item.sellPrice || 0,
              suggestedBuy: item.suggestedBuy || item.buyPrice || 0,
              suggestedSell: item.suggestedSell || item.sellPrice || 0,
              suggestedProfit: item.suggestedProfit || item.netProfit || 0,
              netProfit: item.netProfit || 0,
              spreadPercent: item.spreadPercent || 0,
              volume: item.volume || 0,
              isVeryHighVolume: item.isVeryHighVolume || false,
              isHighVolume: item.isHighVolume || false,
              buyLimit: item.buyLimit || 0,
              recommendedQty: recommendedQty,
              potentialProfit: item.potentialProfit || (profitPerItem * recommendedQty),
              totalCost: item.totalCost || (costPerItem * recommendedQty),
              assignedAt: new Date().toISOString()
            }
          };
        }
        return slot;
      });
      
      return updated;
    });
  };

  const clearSlot = (slotId) => {
    // Normalize slotId to number for comparison
    const normalizedSlotId = typeof slotId === 'string' ? parseInt(slotId, 10) : slotId;
    if (isNaN(normalizedSlotId)) {
      console.error('clearSlot: Invalid slot ID', slotId);
      return;
    }
    setSlots(prev => prev.map(slot => {
      const normalizedId = typeof slot.id === 'string' ? parseInt(slot.id, 10) : slot.id;
      return normalizedId === normalizedSlotId ? { ...slot, item: null } : slot;
    }));
  };

  const updateSlotQuantity = (slotId, newQty) => {
    // Normalize slotId to number for comparison
    const normalizedSlotId = typeof slotId === 'string' ? parseInt(slotId, 10) : slotId;
    if (isNaN(normalizedSlotId)) {
      console.error('updateSlotQuantity: Invalid slot ID', slotId);
      return;
    }
    setSlots(prev => prev.map(slot => {
      const normalizedId = typeof slot.id === 'string' ? parseInt(slot.id, 10) : slot.id;
      if (normalizedId !== normalizedSlotId || !slot.item) return slot;
      const qty = Math.max(0, parseInt(newQty) || 0);
      const profitPerItem = slot.item.suggestedProfit || slot.item.netProfit;
      const costPerItem = slot.item.suggestedBuy || slot.item.buyPrice;
      return {
        ...slot,
        item: {
          ...slot.item,
          recommendedQty: qty,
          totalCost: qty * costPerItem,
          potentialProfit: qty * profitPerItem
        }
      };
    }));
  };

  const changeSlotType = (slotId, newType) => {
    // Normalize slotId to number for comparison
    const normalizedSlotId = typeof slotId === 'string' ? parseInt(slotId, 10) : slotId;
    if (isNaN(normalizedSlotId)) {
      console.error('changeSlotType: Invalid slot ID', slotId);
      return;
    }
    const labels = {
      liquid: 'Liquid Staple',
      medium: 'Medium Margin',
      opportunity: 'Opportunity'
    };
    setSlots(prev => prev.map(slot => {
      const normalizedId = typeof slot.id === 'string' ? parseInt(slot.id, 10) : slot.id;
      return normalizedId === normalizedSlotId ? { ...slot, type: newType, label: labels[newType] } : slot;
    }));
  };

  // Helper function to check if a slot is filled
  const isSlotFilled = (slot) => {
    if (!slot) return false;
    if (!slot.item) return false;
    if (slot.item === null || slot.item === undefined) return false;
    // Check if item has valid id or name (not empty object)
    const result = !!(slot.item.id || slot.item.name);
    return result;
  };

  const slotStats = useMemo(() => {
    if (!slots || !Array.isArray(slots)) {
      return { 
        filled: 0, 
        total: 0, 
        byType: { liquid: [], medium: [], opportunity: [] }, 
        totalPotentialProfit: 0, 
        totalCost: 0 
      };
    }
    
    const filled = slots.filter(isSlotFilled).length;
    const byType = {
      liquid: slots.filter(s => s && s.type === 'liquid') || [],
      medium: slots.filter(s => s && s.type === 'medium') || [],
      opportunity: slots.filter(s => s && s.type === 'opportunity') || []
    };
    const totalPotentialProfit = slots.reduce((sum, s) => {
      if (!s || !s.item || s.item === null) return sum;
      const profitPerItem = s.item.suggestedProfit || s.item.netProfit || 0;
      const qty = s.item.recommendedQty || 1;
      return sum + (s.item.potentialProfit || (profitPerItem * qty));
    }, 0);
    const totalCost = slots.reduce((sum, s) => {
      if (!s || !s.item || s.item === null) return sum;
      const costPerItem = s.item.suggestedBuy || s.item.buyPrice || 0;
      const qty = s.item.recommendedQty || 1;
      return sum + (s.item.totalCost || (costPerItem * qty));
    }, 0);
    return { filled, total: slots.length, byType, totalPotentialProfit, totalCost };
  }, [slots]);

  return {
    slots,
    slotStats,
    assignToSlot,
    clearSlot,
    updateSlotQuantity,
    changeSlotType,
    setSlots,
    isSlotFilled
  };
};
