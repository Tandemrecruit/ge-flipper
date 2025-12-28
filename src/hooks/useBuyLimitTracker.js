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

  // Initialize buy limits from mapping
  useEffect(() => {
    if (!mapping || Object.keys(mapping).length === 0) return;

    setBuyLimits(prev => {
      const updated = { ...prev };
      Object.values(mapping).forEach(item => {
        if (item.id && !updated[item.id]) {
          updated[item.id] = {
            itemId: item.id,
            itemName: item.name,
            buyLimit: item.limit || 0,
            purchased: 0,
            lastReset: new Date().toISOString()
          };
        }
      });
      return updated;
    });
  }, [mapping]);

  // Track purchases from flip log
  useEffect(() => {
    if (!flipLog || flipLog.length === 0) return;

    setBuyLimits(prev => {
      const updated = { ...prev };
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      flipLog.forEach(flip => {
        if (!flip.itemId || flip.status !== 'complete' || !flip.buyPrice) return;

        const limit = updated[flip.itemId];
        if (!limit) return;

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
  }, [flipLog]);

  // Get remaining buy limit for an item
  const getRemainingLimit = (itemId) => {
    const limit = buyLimits[itemId];
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
