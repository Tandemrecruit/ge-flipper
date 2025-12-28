import { useState, useEffect, useMemo, useRef } from 'react';
import { calculateTax, netToGross } from '../utils/calculations';

export const useFlipTracker = () => {
  const [flipLog, setFlipLog] = useState(() => {
    try {
      const saved = localStorage.getItem('ge-flip-tracker');
      const parsed = saved ? JSON.parse(saved) : [];
      // Migrate existing entries: recalculate expected profit if they have suggestedSell but expectedProfit is 0/null/undefined
      // Expected profit should always be calculated from target sell price, regardless of actual sell price
      const migrated = parsed.map(flip => {
        const hasTargetSell = flip.suggestedSell && flip.suggestedSell > 0;
        const needsRecalc = hasTargetSell && (flip.expectedProfit === 0 || flip.expectedProfit == null) && flip.buyPrice && flip.quantity;
        if (needsRecalc) {
          // Expected profit = (netSellPrice - buyPrice) * quantity
          // where netSellPrice = suggestedSell - tax
          const taxPerItem = calculateTax(flip.suggestedSell);
          const netSell = flip.suggestedSell - taxPerItem;
          flip.expectedProfit = (netSell - flip.buyPrice) * flip.quantity;
        }
        return flip;
      });
      return migrated;
    } catch { 
      return []; 
    }
  });
  
  // Use ref to always have latest flipLog value in event listener
  const flipLogRef = useRef(flipLog);
  useEffect(() => {
    flipLogRef.current = flipLog;
  }, [flipLog]);

  const [newFlip, setNewFlip] = useState({ 
    itemId: '', 
    itemName: '', 
    buyPrice: '', 
    sellPrice: '', 
    quantity: '', 
    expectedProfit: 0, 
    suggestedSell: 0, 
    suggestedBuy: 0, 
    sellPriceIsNet: true 
  });

  // Track if this is the initial mount to avoid broadcasting empty state
  const isInitialMount = useRef(true);
  
  // Save flip log to localStorage
  useEffect(() => {
    try {
      const serialized = JSON.stringify(flipLog);
      localStorage.setItem('ge-flip-tracker', serialized);
      
      // Only dispatch event if this is not the initial mount (to avoid clearing other instances)
      // OR if we actually have items (to broadcast new additions)
      if (!isInitialMount.current || flipLog.length > 0) {
        // Trigger a custom event so other instances can sync
        window.dispatchEvent(new CustomEvent('flipLogUpdated', { detail: flipLog }));
      }
      
      // Mark that initial mount is complete
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    } catch (err) {
      console.error('Failed to save flip log:', err);
    }
  }, [flipLog]);

  // Listen for updates from other instances (to sync between App.jsx and FlipTracker)
  useEffect(() => {
    const handleUpdate = (e) => {
      const updatedLog = e.detail;
      if (Array.isArray(updatedLog)) {
        // Use ref to get latest value (avoid stale closure)
        const currentLog = flipLogRef.current;
        
        // Never update to an empty array if we have items (prevents clearing)
        if (updatedLog.length === 0 && currentLog.length > 0) {
          console.log('flipLogUpdated: Ignoring empty update (current log has items)');
          return;
        }
        
        // Always prefer the longer log, or if same length, prefer the one with newer items
        const shouldUpdate = updatedLog.length > currentLog.length || 
          (updatedLog.length === currentLog.length && updatedLog.length > 0 && 
           Math.max(...updatedLog.map(f => f.id || 0)) > Math.max(...currentLog.map(f => f.id || 0)));
        
        console.log('flipLogUpdated event received', {
          currentLength: currentLog.length,
          updatedLength: updatedLog.length,
          shouldUpdate
        });
        
        if (shouldUpdate) {
          console.log('flipLogUpdated: Updating flip log', updatedLog.length, 'items');
          setFlipLog(updatedLog);
        } else {
          console.log('flipLogUpdated: Ignoring update (current log is same or newer)');
        }
      }
    };
    window.addEventListener('flipLogUpdated', handleUpdate);
    return () => window.removeEventListener('flipLogUpdated', handleUpdate);
  }, []); // Empty deps - ref ensures we always have latest value

  const addFlip = (item) => {
    if (!item || !item.name) {
      console.error('Invalid item provided to addFlip');
      return;
    }
    
    const suggestedBuy = item.suggestedBuy || item.buyPrice || 0;
    const suggestedSell = item.suggestedSell || item.sellPrice || 0;
    const expectedProfit = item.suggestedProfit || item.netProfit || 0;
    
    // Validate that we have at least a buy price
    if (!suggestedBuy || suggestedBuy <= 0) {
      console.error('Cannot add flip: missing or invalid buy price', item);
      return;
    }
    
    // Set newFlip so user can edit in the form before saving
    setNewFlip({
      itemId: item.id || 0,
      itemName: item.name,
      buyPrice: suggestedBuy.toString(),
      sellPrice: '',
      quantity: '1',
      expectedProfit: expectedProfit,
      suggestedSell: suggestedSell || 0,
      suggestedBuy: suggestedBuy,
      sellPriceIsNet: true,
      status: 'buying'
    });
  };

  const saveFlip = () => {
    if (!newFlip.itemName || !newFlip.buyPrice || !newFlip.quantity) return;
    
    const buy = parseFloat(newFlip.buyPrice);
    const enteredSell = parseFloat(newFlip.sellPrice) || 0;
    const qty = parseInt(newFlip.quantity);
    const sellIsNet = newFlip.sellPriceIsNet;
    
    let grossSell, netSell, taxPerItem;
    if (enteredSell) {
      if (sellIsNet) {
        netSell = enteredSell;
        grossSell = netToGross(enteredSell);
        taxPerItem = grossSell - netSell;
      } else {
        grossSell = enteredSell;
        taxPerItem = calculateTax(grossSell);
        netSell = grossSell - taxPerItem;
      }
    } else {
      grossSell = 0;
      netSell = 0;
      taxPerItem = 0;
    }
    const tax = taxPerItem * qty;
    
    const actualProfit = enteredSell ? (netSell - buy) * qty : null;
    
    // Calculate expected profit
    // If a target sell price (suggestedSell) is provided, always calculate expected profit from it
    // Otherwise, for manual entries without target, use actual profit if available
    // Ensure suggestedSell is properly parsed (handle undefined, null, string, or number values)
    let suggestedSell = 0;
    let hasTargetSellPrice = false;
    
    if (newFlip.suggestedSell != null && newFlip.suggestedSell !== '') {
      if (typeof newFlip.suggestedSell === 'number' && !isNaN(newFlip.suggestedSell)) {
        suggestedSell = newFlip.suggestedSell;
        hasTargetSellPrice = suggestedSell > 0;
      } else {
        const parsed = parseFloat(newFlip.suggestedSell);
        if (!isNaN(parsed) && parsed > 0) {
          suggestedSell = parsed;
          hasTargetSellPrice = true;
        }
      }
    }
    
    let expectedTotal;
    if (hasTargetSellPrice) {
      // Always calculate expected profit when a target sell price is provided
      // Expected profit = (netSellPrice - buyPrice) * quantity
      // where netSellPrice = suggestedSell - tax
      const taxPerItem = calculateTax(suggestedSell);
      const netSell = suggestedSell - taxPerItem;
      expectedTotal = (netSell - buy) * qty;
      console.log('Expected profit calculated:', { suggestedSell, buy, qty, expectedTotal });
    } else {
      // Manual entry without target sell price - use actual profit or 0
      expectedTotal = actualProfit || 0;
      console.log('No suggestedSell, using actualProfit:', { actualProfit, expectedTotal });
    }
    
    // Calculate total sell prices (per-item * quantity) to be consistent with updateFlipSale
    const totalGrossSell = enteredSell ? grossSell * qty : null;
    const totalNetSell = enteredSell ? netSell * qty : null;
    
    const flip = {
      id: Date.now(),
      itemId: newFlip.itemId,
      itemName: newFlip.itemName,
      buyPrice: buy,
      sellPrice: totalGrossSell,
      netSellPrice: totalNetSell,
      suggestedSell: (typeof newFlip.suggestedSell === 'number' && !isNaN(newFlip.suggestedSell)) 
        ? newFlip.suggestedSell 
        : (newFlip.suggestedSell != null && newFlip.suggestedSell !== '' 
          ? (isNaN(parseFloat(newFlip.suggestedSell)) ? 0 : parseFloat(newFlip.suggestedSell))
          : 0),
      suggestedBuy: typeof newFlip.suggestedBuy === 'number' ? newFlip.suggestedBuy : (parseFloat(newFlip.suggestedBuy) || 0),
      quantity: qty,
      expectedProfit: expectedTotal,
      actualProfit: actualProfit,
      tax,
      status: enteredSell ? 'complete' : 'pending',
      date: new Date().toISOString()
    };
    
    setFlipLog(prev => [flip, ...prev]);
    setNewFlip({ itemId: '', itemName: '', buyPrice: '', sellPrice: '', quantity: '', expectedProfit: 0, suggestedSell: 0, suggestedBuy: 0, sellPriceIsNet: true });
  };

  const updateFlipSale = (flipId, sellPrice, soldQty = null, isNet = true) => {
    setFlipLog(prev => prev.map(flip => {
      if (flip.id !== flipId) return flip;
      const enteredSell = parseFloat(sellPrice);
      const qty = soldQty !== null ? parseInt(soldQty) : flip.quantity;
      
      let grossSell, netSell, taxPerItem;
      if (isNet) {
        netSell = enteredSell;
        grossSell = netToGross(enteredSell);
        taxPerItem = grossSell - netSell;
      } else {
        grossSell = enteredSell;
        taxPerItem = calculateTax(grossSell);
        netSell = grossSell - taxPerItem;
      }
      const tax = taxPerItem * qty;
      const actualProfit = (netSell - flip.buyPrice) * qty;
      
      // Calculate total sell prices (per-item * quantity)
      const totalGrossSell = grossSell * qty;
      const totalNetSell = netSell * qty;
      
      let expectedProfit = flip.expectedProfit;
      if (soldQty !== null && flip.suggestedSell) {
        // Expected profit = (netSellPrice - buyPrice) * quantity
        // where netSellPrice = suggestedSell - tax
        const taxPerItem = calculateTax(flip.suggestedSell);
        const netSell = flip.suggestedSell - taxPerItem;
        expectedProfit = (netSell - flip.buyPrice) * qty;
      }
      return {
        ...flip,
        sellPrice: totalGrossSell,
        netSellPrice: totalNetSell,
        quantity: qty,
        expectedProfit,
        actualProfit,
        tax,
        status: 'complete'
      };
    }));
  };

  const deleteFlip = (flipId) => {
    setFlipLog(prev => {
      // Find the flip being deleted
      const deletedFlip = prev.find(f => f.id === flipId);
      if (!deletedFlip) return prev;
      
      // If this is a split entry, restore the original entry
      if (deletedFlip.splitFrom !== null && deletedFlip.splitFrom !== undefined) {
        return prev.map(flip => {
          // Find the original flip that this split came from
          if (flip.id === deletedFlip.splitFrom) {
            // Restore the original quantity by adding back the deleted split's quantity
            const restoredQty = flip.quantity + deletedFlip.quantity;
            
            // Recalculate expected profit for the restored quantity
            // Expected profit = (netSellPrice - buyPrice) * quantity
            // where netSellPrice = suggestedSell - tax
            const suggestedSell = flip.suggestedSell || 0;
            const taxPerItem = calculateTax(suggestedSell);
            const netSell = suggestedSell - taxPerItem;
            const restoredExpectedProfit = (netSell - flip.buyPrice) * restoredQty;
            
            return {
              ...flip,
              quantity: restoredQty,
              expectedProfit: restoredExpectedProfit
            };
          }
          return flip;
        }).filter(flip => flip.id !== flipId); // Remove the deleted split entry
      }
      
      // If not a split entry, just remove it
      return prev.filter(flip => flip.id !== flipId);
    });
  };

  const splitFlip = (flipId, splitQty, splitSellPrice, isNet = true) => {
    setFlipLog(prev => {
      const flipIndex = prev.findIndex(f => f.id === flipId);
      if (flipIndex === -1) return prev;
      
      const originalFlip = prev[flipIndex];
      const remainingQty = originalFlip.quantity - splitQty;
      
      if (remainingQty <= 0 || splitQty <= 0) return prev;
      
      let grossSell, netSell, splitTaxPerItem;
      if (isNet) {
        netSell = splitSellPrice;
        grossSell = netToGross(splitSellPrice);
        splitTaxPerItem = grossSell - netSell;
      } else {
        grossSell = splitSellPrice;
        splitTaxPerItem = calculateTax(grossSell);
        netSell = grossSell - splitTaxPerItem;
      }
      
      const splitTax = splitTaxPerItem * splitQty;
      const splitActualProfit = (netSell - originalFlip.buyPrice) * splitQty;
      // Expected profit = (netSellPrice - buyPrice) * quantity
      // where netSellPrice = suggestedSell - tax
      const targetSell = originalFlip.suggestedSell || grossSell;
      const expectedTaxPerItem = calculateTax(targetSell);
      const expectedNetSell = targetSell - expectedTaxPerItem;
      const splitExpectedProfit = (expectedNetSell - originalFlip.buyPrice) * splitQty;
      
      // Calculate total sell prices (per-item * quantity)
      const totalGrossSell = grossSell * splitQty;
      const totalNetSell = netSell * splitQty;
      
      const splitEntry = {
        ...originalFlip,
        id: Date.now(),
        quantity: splitQty,
        sellPrice: totalGrossSell,
        netSellPrice: totalNetSell,
        expectedProfit: splitExpectedProfit,
        actualProfit: splitActualProfit,
        tax: splitTax,
        status: 'complete',
        splitFrom: originalFlip.id,
        date: new Date().toISOString() // Use current date for the split sale
      };
      
      // Expected profit = (netSellPrice - buyPrice) * quantity
      // where netSellPrice = suggestedSell - tax
      const suggestedSell = originalFlip.suggestedSell || 0;
      const taxPerItem = calculateTax(suggestedSell);
      const netSell = suggestedSell - taxPerItem;
      const remainingExpectedProfit = (netSell - originalFlip.buyPrice) * remainingQty;
      
      const updatedOriginal = {
        ...originalFlip,
        quantity: remainingQty,
        expectedProfit: remainingExpectedProfit,
        sellPrice: null,
        netSellPrice: null,
        actualProfit: null,
        tax: 0,
        status: 'pending'
      };
      
      const newLog = [...prev];
      newLog[flipIndex] = updatedOriginal;
      newLog.splice(flipIndex, 0, splitEntry);
      return newLog;
    });
  };

  const editFlip = (flipId, updates, sellIsNet = true) => {
    setFlipLog(prev => prev.map(flip => {
      if (flip.id !== flipId) return flip;
      
      const newFlip = { ...flip, ...updates };
      
      // Check if we need to recalculate values
      const needsRecalc = updates.buyPrice !== undefined || 
                         updates.sellPrice !== undefined || 
                         updates.quantity !== undefined ||
                         updates.suggestedSell !== undefined;
      
      if (needsRecalc) {
        const buy = newFlip.buyPrice;
        const enteredSell = newFlip.sellPrice; // This is per-item price from modal
        const qty = newFlip.quantity;
        const suggestedSell = newFlip.suggestedSell || 0;
        
        // Calculate expected profit
        // For manual entries (no suggestedSell), use actual profit if available, otherwise 0
        // This prevents manual entries from showing huge negative expected values
        if (suggestedSell > 0) {
          // Expected profit = (netSellPrice - buyPrice) * quantity
          // where netSellPrice = suggestedSell - tax
          const taxPerItem = calculateTax(suggestedSell);
          const netSell = suggestedSell - taxPerItem;
          newFlip.expectedProfit = (netSell - buy) * qty;
        } else {
          // Manual entry without suggested prices - use actual profit or 0
          // We'll calculate this after we know the actual profit
          newFlip.expectedProfit = 0;
        }
        
        if (enteredSell && enteredSell > 0) {
          // If we're only updating buy price or quantity (not sell price), preserve existing sell price per item
          if (updates.sellPrice === undefined && flip.netSellPrice && flip.quantity > 0) {
            // Use existing net sell price per item to recalculate with new quantity
            const netSellPerItem = flip.netSellPrice / flip.quantity;
            const grossSellPerItem = flip.sellPrice / flip.quantity;
            const taxPerItem = grossSellPerItem - netSellPerItem;
            
            newFlip.netSellPrice = netSellPerItem * qty;
            newFlip.sellPrice = grossSellPerItem * qty;
            newFlip.actualProfit = (netSellPerItem - buy) * qty;
            newFlip.tax = taxPerItem * qty;
            
            // For manual entries, update expected profit to match actual profit
            if (suggestedSell === 0) {
              newFlip.expectedProfit = newFlip.actualProfit;
            }
          } else {
            // Recalculating sell price (new sale or sell price changed)
            // enteredSell is per-item price
            let grossSell, netSell, taxPerItem;
            if (sellIsNet) {
              netSell = enteredSell;
              grossSell = netToGross(enteredSell);
              taxPerItem = grossSell - netSell;
            } else {
              grossSell = enteredSell;
              taxPerItem = calculateTax(grossSell);
              netSell = grossSell - taxPerItem;
            }
            // Calculate total sell prices (per-item * quantity)
            const totalGrossSell = grossSell * qty;
            const totalNetSell = netSell * qty;
            newFlip.sellPrice = totalGrossSell;
            newFlip.netSellPrice = totalNetSell;
            newFlip.actualProfit = (netSell - buy) * qty;
            newFlip.tax = taxPerItem * qty;
            
            // For manual entries, update expected profit to match actual profit
            if (suggestedSell === 0) {
              newFlip.expectedProfit = newFlip.actualProfit;
            }
          }
          newFlip.status = 'complete';
        } else {
          // Clear sell price if it was set to null/empty
          newFlip.sellPrice = null;
          newFlip.netSellPrice = null;
          newFlip.actualProfit = null;
          newFlip.tax = 0;
          newFlip.status = 'pending';
          
          // For manual entries without a sell price, expected profit should be 0
          if (suggestedSell === 0) {
            newFlip.expectedProfit = 0;
          }
        }
      } else if (updates.suggestedSell !== undefined) {
        // Only suggestedSell changed, recalculate expected profit
        const buy = newFlip.buyPrice;
        const qty = newFlip.quantity;
        const suggestedSell = newFlip.suggestedSell || 0;
        
        if (suggestedSell > 0) {
          // Expected profit = (netSellPrice - buyPrice) * quantity
          // where netSellPrice = suggestedSell - tax
          const taxPerItem = calculateTax(suggestedSell);
          const netSell = suggestedSell - taxPerItem;
          newFlip.expectedProfit = (netSell - buy) * qty;
        } else {
          // If clearing suggestedSell, use actual profit if available, otherwise 0
          newFlip.expectedProfit = newFlip.actualProfit || 0;
        }
      }
      
      return newFlip;
    }));
  };

  const flipStats = useMemo(() => {
    const completed = flipLog.filter(f => f.status === 'complete');
    // For expected profit: use actual profit for manual entries (no suggestedSell) 
    // to prevent huge negative expected values from skewing stats
    const totalExpected = completed.reduce((sum, f) => {
      // If no suggestedSell, this is a manual entry - use actual profit instead
      if (!f.suggestedSell || f.suggestedSell === 0) {
        return sum + (f.actualProfit || 0);
      }
      return sum + (f.expectedProfit || 0);
    }, 0);
    const totalActual = completed.reduce((sum, f) => sum + (f.actualProfit || 0), 0);
    const totalTax = completed.reduce((sum, f) => sum + (f.tax || 0), 0);
    const winRate = completed.length > 0 
      ? (completed.filter(f => f.actualProfit > 0).length / completed.length * 100) 
      : 0;
    return { completed: completed.length, pending: flipLog.length - completed.length, totalExpected, totalActual, totalTax, winRate };
  }, [flipLog]);

  const itemAnalytics = useMemo(() => {
    const completed = flipLog.filter(f => f.status === 'complete');
    const itemMap = {};
    
    completed.forEach(flip => {
      const name = flip.itemName;
      if (!itemMap[name]) {
        itemMap[name] = {
          name,
          itemId: flip.itemId,
          flips: 0,
          wins: 0,
          losses: 0,
          totalProfit: 0,
          totalExpected: 0,
          totalInvested: 0,
          totalQuantity: 0,
          bestFlip: null,
          worstFlip: null,
          avgBuyPrice: 0,
          avgSellPrice: 0,
          buyPrices: [],
          sellPrices: [],
          profits: []
        };
      }
      
      const item = itemMap[name];
      item.flips++;
      item.totalProfit += flip.actualProfit || 0;
      // For manual entries (no suggestedSell), use actual profit as expected
      const isManualEntry = !flip.suggestedSell || flip.suggestedSell === 0;
      item.totalExpected += isManualEntry ? (flip.actualProfit || 0) : (flip.expectedProfit || 0);
      item.totalInvested += (flip.buyPrice * flip.quantity);
      item.totalQuantity += flip.quantity;
      item.buyPrices.push(flip.buyPrice);
      // Convert total sell price to per-item price for accurate averaging
      const totalSellPrice = flip.netSellPrice || flip.sellPrice;
      const perItemSellPrice = totalSellPrice && flip.quantity > 0 ? totalSellPrice / flip.quantity : 0;
      item.sellPrices.push(perItemSellPrice);
      item.profits.push(flip.actualProfit || 0);
      
      if (flip.actualProfit > 0) item.wins++;
      else item.losses++;
      
      if (!item.bestFlip || (flip.actualProfit || 0) > (item.bestFlip.actualProfit || 0)) {
        item.bestFlip = flip;
      }
      if (!item.worstFlip || (flip.actualProfit || 0) < (item.worstFlip.actualProfit || 0)) {
        item.worstFlip = flip;
      }
    });
    
    Object.values(itemMap).forEach(item => {
      item.winRate = item.flips > 0 ? (item.wins / item.flips * 100) : 0;
      item.avgProfit = item.flips > 0 ? item.totalProfit / item.flips : 0;
      item.roi = item.totalInvested > 0 ? (item.totalProfit / item.totalInvested * 100) : 0;
      item.avgBuyPrice = item.buyPrices.length > 0 ? item.buyPrices.reduce((a, b) => a + b, 0) / item.buyPrices.length : 0;
      item.avgSellPrice = item.sellPrices.length > 0 ? item.sellPrices.reduce((a, b) => a + b, 0) / item.sellPrices.length : 0;
      item.profitVariance = item.profits.length > 1 
        ? Math.sqrt(item.profits.reduce((sum, p) => sum + Math.pow(p - item.avgProfit, 2), 0) / item.profits.length)
        : 0;
      item.consistency = item.profitVariance > 0 ? item.avgProfit / item.profitVariance : (item.avgProfit > 0 ? 100 : 0);
      item.performanceVsExpected = item.totalExpected > 0 ? ((item.totalProfit - item.totalExpected) / item.totalExpected * 100) : 0;
    });
    
    return Object.values(itemMap).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [flipLog]);

  const topPerformers = useMemo(() => {
    const minFlips = 1;
    const qualified = itemAnalytics.filter(i => i.flips >= minFlips);
    
    return {
      profit: [...qualified].sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 5),
      loss: [...qualified].filter(i => i.totalProfit < 0).sort((a, b) => a.totalProfit - b.totalProfit).slice(0, 5),
      winRate: [...qualified].filter(i => i.flips >= 3).sort((a, b) => b.winRate - a.winRate).slice(0, 5),
      roi: [...qualified].sort((a, b) => b.roi - a.roi).slice(0, 5),
      consistent: [...qualified].filter(i => i.flips >= 3).sort((a, b) => b.consistency - a.consistency).slice(0, 5),
      volume: [...qualified].sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 5),
      avgProfit: [...qualified].sort((a, b) => b.avgProfit - a.avgProfit).slice(0, 5),
      overperforming: [...qualified].filter(i => i.performanceVsExpected > 0).sort((a, b) => b.performanceVsExpected - a.performanceVsExpected).slice(0, 5),
      underperforming: [...qualified].filter(i => i.performanceVsExpected < 0).sort((a, b) => a.performanceVsExpected - b.performanceVsExpected).slice(0, 5)
    };
  }, [itemAnalytics]);

  return {
    flipLog,
    setFlipLog,
    flipStats,
    itemAnalytics,
    topPerformers,
    newFlip,
    setNewFlip,
    addFlip,
    saveFlip,
    updateFlipSale,
    deleteFlip,
    splitFlip,
    editFlip
  };
};
