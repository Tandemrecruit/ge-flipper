import { useState, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'ge-buy-limits';

export const useBuyLimitTracker = (flipLog, mapping) => {
  const [buyLimits, setBuyLimits] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save buy limits to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buyLimits));
    } catch (err) {
      console.error('Failed to save buy limits:', err);
    }
  }, [buyLimits]);

  // Track purchases from flip log
  useEffect(() => {
    if (!flipLog || flipLog.length === 0) return;

    setBuyLimits(prev => {
      const updated = { ...prev };
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      flipLog.forEach(flip => {
        if (!flip.itemId || flip.status !== 'complete' || !flip.buyPrice) return;

        // Create record on-demand if it doesn't exist
        if (!updated[flip.itemId]) {
          const item = mapping && mapping[flip.itemId];
          updated[flip.itemId] = {
            itemId: flip.itemId,
            itemName: item?.name || flip.itemName || '',
            buyLimit: item?.limit || 0,
            purchased: 0,
            lastReset: now.toISOString()
          };
        }

        const limit = updated[flip.itemId];
        const flipDate = new Date(flip.date).toISOString().split('T')[0];
        const lastResetDate = limit.lastReset ? new Date(limit.lastReset).toISOString().split('T')[0] : null;

        // Reset if it's a new day
        if (lastResetDate !== today) {
          limit.purchased = 0;
          limit.lastReset = now.toISOString();
        }

        // Only count if flip was today
        if (flipDate === today) {
          limit.purchased = (limit.purchased || 0) + flip.quantity;
        }
      });

      return updated;
    });
  }, [flipLog, mapping]);

  // Get remaining buy limit for an item (creates record on-demand if needed)
  const getRemainingLimit = (itemId) => {
    let limit = buyLimits[itemId];
    
    // Create record on-demand if it doesn't exist
    if (!limit && mapping && mapping[itemId]) {
      const item = mapping[itemId];
      const now = new Date();
      const newRecord = {
        itemId: item.id,
        itemName: item.name,
        buyLimit: item.limit || 0,
        purchased: 0,
        lastReset: now.toISOString()
      };
      
      // Create the record in state for future calls
      setBuyLimits(prev => {
        if (prev[itemId]) return prev; // Already created by another call
        return { ...prev, [itemId]: newRecord };
      });
      
      // Use the newly created record for this call
      limit = newRecord;
    }
    
    if (!limit) return null;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastResetDate = limit.lastReset ? new Date(limit.lastReset).toISOString().split('T')[0] : null;

    // Reset if it's a new day
    if (lastResetDate !== today) {
      return limit.buyLimit;
    }

    return Math.max(0, limit.buyLimit - (limit.purchased || 0));
  };

  // Manually update purchased count
  const updatePurchased = (itemId, quantity) => {
    setBuyLimits(prev => {
      const updated = { ...prev };
      if (!updated[itemId]) {
        updated[itemId] = {
          itemId,
          itemName: '',
          buyLimit: 0,
          purchased: 0,
          lastReset: new Date().toISOString()
        };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lastResetDate = updated[itemId].lastReset 
        ? new Date(updated[itemId].lastReset).toISOString().split('T')[0] 
        : null;

      if (lastResetDate !== today) {
        updated[itemId].purchased = 0;
        updated[itemId].lastReset = now.toISOString();
      }

      updated[itemId].purchased = Math.max(0, (updated[itemId].purchased || 0) + quantity);
      return updated;
    });
  };

  // Get all items with remaining limits
  const getItemsWithLimits = () => {
    return Object.values(buyLimits)
      .map(limit => ({
        ...limit,
        remaining: getRemainingLimit(limit.itemId)
      }))
      .filter(limit => limit.remaining !== null && limit.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);
  };

  return {
    buyLimits,
    getRemainingLimit,
    updatePurchased,
    getItemsWithLimits
  };
};
