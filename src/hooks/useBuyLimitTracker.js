import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ge-buy-limits';
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

// Migrate old format data to new format
const migrateBuyLimitData = (data) => {
  if (!data || typeof data !== 'object') return {};
  
  const migrated = {};
  const now = new Date();
  
  Object.entries(data).forEach(([itemId, limit]) => {
    // Check if it's old format (has 'purchased' and 'lastReset' but no 'purchases')
    if (limit && typeof limit === 'object' && 'purchased' in limit && !('purchases' in limit)) {
      // Migrate old format to new format
      const purchases = [];
      
      // If there was a purchased count and lastReset, try to preserve it
      if (limit.purchased > 0 && limit.lastReset) {
        const resetTime = new Date(limit.lastReset);
        const timeSinceReset = now.getTime() - resetTime.getTime();
        
        // Only migrate if the reset was within the last 4 hours
        if (timeSinceReset < FOUR_HOURS_MS && timeSinceReset >= 0) {
          purchases.push({
            timestamp: limit.lastReset,
            quantity: limit.purchased
          });
        }
      }
      
      migrated[itemId] = {
        itemId: limit.itemId || itemId,
        itemName: limit.itemName || '',
        buyLimit: limit.buyLimit || 0,
        purchases: purchases
      };
    } else if (limit && typeof limit === 'object' && 'purchases' in limit) {
      // Already new format, but clean up old purchases outside 4-hour window
      const now = new Date();
      const cutoffTime = now.getTime() - FOUR_HOURS_MS;
      
      migrated[itemId] = {
        ...limit,
        purchases: (limit.purchases || []).filter(p => {
          const purchaseTime = new Date(p.timestamp).getTime();
          return purchaseTime > cutoffTime;
        })
      };
    } else {
      // Unknown format, keep as-is but ensure purchases array exists
      migrated[itemId] = {
        ...limit,
        purchases: limit.purchases || []
      };
    }
  });
  
  return migrated;
};

export const useBuyLimitTracker = (flipLog, mapping) => {
  const [buyLimits, setBuyLimits] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return migrateBuyLimitData(parsed);
      }
      return {};
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
      const cutoffTime = now.getTime() - FOUR_HOURS_MS;

      // Group flips by itemId and recompute purchases from scratch
      const purchasesByItem = {};
      
      flipLog.forEach(flip => {
        if (!flip.itemId || (flip.status !== 'complete' && flip.status !== 'pending') || !flip.buyPrice) return;

        const flipTimestamp = flip.date ? new Date(flip.date).toISOString() : now.toISOString();
        const flipTime = new Date(flipTimestamp).getTime();
        
        // Only include flips within the last 4 hours (rolling window)
        if (flipTime > cutoffTime) {
          if (!purchasesByItem[flip.itemId]) {
            purchasesByItem[flip.itemId] = [];
          }
          purchasesByItem[flip.itemId].push({
            timestamp: flipTimestamp,
            quantity: flip.quantity || 0
          });
        }
      });

      // Update or create entries for items with purchases
      Object.keys(purchasesByItem).forEach(itemId => {
        if (prev[itemId]) {
          // Update existing entry
          updated[itemId] = {
            ...prev[itemId],
            purchases: purchasesByItem[itemId]
          };
        } else if (mapping && mapping[itemId]) {
          // Create new entry from mapping data (auto-track from flip)
          const item = mapping[itemId];
          updated[itemId] = {
            itemId: item.id,
            itemName: item.name,
            buyLimit: item.limit || 0,
            purchases: purchasesByItem[itemId]
          };
        }
      });

      // Clean up purchases for all items in prev (rolling 4-hour window)
      Object.keys(prev).forEach(itemId => {
        if (!purchasesByItem[itemId] && prev[itemId]) {
          // Item exists in prev but no new purchases - just clean up old ones
          if (Array.isArray(prev[itemId].purchases)) {
            const cleanedPurchases = prev[itemId].purchases.filter(p => {
              const purchaseTime = new Date(p.timestamp).getTime();
              return purchaseTime > cutoffTime;
            });
            // Only keep the item if it still has purchases or if we want to preserve the record
            updated[itemId] = {
              ...prev[itemId],
              purchases: cleanedPurchases
            };
          }
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
      const newRecord = {
        itemId: item.id,
        itemName: item.name,
        buyLimit: item.limit || 0,
        purchases: []
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
    const cutoffTime = now.getTime() - FOUR_HOURS_MS;
    
    // Use empty array as fallback without mutating state
    const purchases = Array.isArray(limit.purchases) ? limit.purchases : [];

    // Filter purchases to only those within the last 4 hours
    const recentPurchases = purchases.filter(p => {
      const purchaseTime = new Date(p.timestamp).getTime();
      return purchaseTime > cutoffTime;
    });
    
    // Sum quantities of recent purchases
    const purchased = recentPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

    return Math.max(0, limit.buyLimit - purchased);
  };

  // Manually update purchased count
  const updatePurchased = (itemId, quantity) => {
    setBuyLimits(prev => {
      const updated = { ...prev };
      const now = new Date();
      const cutoffTime = now.getTime() - FOUR_HOURS_MS;
      
      if (!updated[itemId]) {
        updated[itemId] = {
          itemId,
          itemName: '',
          buyLimit: 0,
          purchases: []
        };
      }

      // Ensure purchases array exists
      if (!Array.isArray(updated[itemId].purchases)) {
        updated[itemId].purchases = [];
      }
      
      // Clean up purchases older than 4 hours
      updated[itemId].purchases = updated[itemId].purchases.filter(p => {
        const purchaseTime = new Date(p.timestamp).getTime();
        return purchaseTime > cutoffTime;
      });

      // Add new purchase with current timestamp
      if (quantity !== 0) {
        updated[itemId].purchases.push({
          timestamp: now.toISOString(),
          quantity: quantity
        });
      }
      
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
