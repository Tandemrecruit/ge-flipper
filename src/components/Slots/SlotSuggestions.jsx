import React, { useMemo } from 'react';
import { useItems } from '../../hooks/useItems';
import { formatGp, formatNumber } from '../../utils/formatters';

export default function SlotSuggestions({ prices, volumes, mapping, availableGold, slots, slotStats, onAssignToSlot, onTabChange }) {
  const { filteredItems } = useItems(prices || {}, volumes || {}, mapping || {}, {
    showSafeOnly: true,
    minProfit: 1000,
    minRoi: 1,
    searchTerm: '',
    availableGold: '', // Don't filter by gold here, we'll do it manually
    sortBy: 'profit',
    sortAsc: false
  });

  // Calculate remaining budget (can be negative if exceeded)
  const remainingBudget = useMemo(() => {
    if (!availableGold) return null;
    const totalBudget = parseFloat(availableGold);
    const committed = slotStats?.totalCost || 0;
    return totalBudget - committed;
  }, [availableGold, slotStats]);

  const suggestions = useMemo(() => {
    if (!filteredItems || filteredItems.length === 0) return { liquid: [], medium: [], opportunity: [] };

    // Get items already assigned to slots
    const assignedItemIds = new Set(
      slots.filter(s => s.item).map(s => s.item.id)
    );

    // Filter out already assigned items
    let availableItems = filteredItems.filter(item => !assignedItemIds.has(item.id));

    // Filter by remaining budget if available (only show items if budget is positive)
    if (remainingBudget !== null && remainingBudget > 0) {
      availableItems = availableItems.filter(item => {
        const costPerItem = item.suggestedBuy || item.buyPrice;
        // Item is affordable if at least 1 can be bought
        return costPerItem <= remainingBudget;
      });
    } else if (remainingBudget !== null && remainingBudget <= 0) {
      // Budget exceeded or at zero - filter out all items
      availableItems = [];
    }

    // Calculate affordable quantity for each item based on remaining budget
    const getAffordableQty = (item, slotType) => {
      if (remainingBudget === null) {
        // No budget constraint
        const suggestedPercent = slotType === 'liquid' ? 0.8 : (slotType === 'medium' ? 0.5 : 0.3);
        return Math.floor((item.buyLimit || 100) * suggestedPercent);
      }
      // If budget is zero or negative, can't afford anything
      if (remainingBudget <= 0) return 0;
      
      const costPerItem = item.suggestedBuy || item.buyPrice;
      if (costPerItem > remainingBudget) return 0;
      
      const suggestedPercent = slotType === 'liquid' ? 0.8 : (slotType === 'medium' ? 0.5 : 0.3);
      const suggestedVol = Math.floor((item.buyLimit || 100) * suggestedPercent);
      const maxAffordable = Math.floor(remainingBudget / costPerItem);
      const maxForDiv = Math.floor((remainingBudget * 0.3) / costPerItem);
      return Math.max(1, Math.min(suggestedVol, maxAffordable, maxForDiv));
    };

    // Liquid suggestions: prioritize high volume, fast turnover, good buy limits
    // Lowered thresholds to allow more items to qualify
    const liquidSuggestions = [...availableItems]
      .filter(item => {
        // Allow isHighVolume (not just isVeryHighVolume) for more flexibility
        if ((item.isHighVolume || item.isVeryHighVolume) && item.isSafeFlip && item.buyLimit >= 500) {
          // Lowered volume thresholds for liquidity
          // For cheaper items (< 100k), require 20k+ volume (down from 50k)
          // For expensive items (>= 100k), require at least 5k volume (down from 10k)
          const minLiquidVolume = (item.buyPrice || 0) < 100000 ? 20000 : 5000;
          if (item.volume < minLiquidVolume) {
            return false;
          }
          return getAffordableQty(item, 'liquid') > 0;
        }
        return false;
      })
      .map(item => {
        const qty = getAffordableQty(item, 'liquid');
        const costPerItem = item.suggestedBuy || item.buyPrice;
        const profitPerItem = item.suggestedProfit || item.netProfit;
        return {
          ...item,
          affordableQty: qty,
          suggestedVolume: qty,
          estimatedCost: qty * costPerItem,
          totalCost: qty * costPerItem,
          potentialProfit: qty * profitPerItem
        };
      })
      .sort((a, b) => {
        // Prioritize by volume (trading activity)
        return b.volume - a.volume;
      })
      .slice(0, 5);

    // Medium suggestions: prioritize higher margins, moderate volume, good ROI
    const mediumSuggestions = [...availableItems]
      .filter(item => {
        if (item.isHighVolume && !item.isVeryHighVolume && item.spreadPercent >= 4 && item.isSafeFlip && item.buyLimit >= 100) {
          return getAffordableQty(item, 'medium') > 0;
        }
        return false;
      })
      .map(item => {
        const qty = getAffordableQty(item, 'medium');
        const costPerItem = item.suggestedBuy || item.buyPrice;
        const profitPerItem = item.suggestedProfit || item.netProfit;
        return {
          ...item,
          affordableQty: qty,
          suggestedVolume: qty,
          estimatedCost: qty * costPerItem,
          totalCost: qty * costPerItem,
          potentialProfit: qty * profitPerItem
        };
      })
      .sort((a, b) => {
        // Prioritize by profit potential
        return (b.suggestedProfit || b.netProfit) - (a.suggestedProfit || a.netProfit);
      })
      .slice(0, 5);

    // Opportunity suggestions: highest profit potential, flexible criteria
    const opportunitySuggestions = [...availableItems]
      .filter(item => {
        if (item.spreadPercent >= 5 && (item.suggestedProfit || item.netProfit) > 50000 && item.buyLimit >= 10) {
          return getAffordableQty(item, 'opportunity') > 0;
        }
        return false;
      })
      .map(item => {
        const qty = getAffordableQty(item, 'opportunity');
        const costPerItem = item.suggestedBuy || item.buyPrice;
        const profitPerItem = item.suggestedProfit || item.netProfit;
        return {
          ...item,
          affordableQty: qty,
          suggestedVolume: qty,
          estimatedCost: qty * costPerItem,
          totalCost: qty * costPerItem,
          potentialProfit: qty * profitPerItem
        };
      })
      .sort((a, b) => {
        // Prioritize by profit potential
        return (b.suggestedProfit || b.netProfit) - (a.suggestedProfit || a.netProfit);
      })
      .slice(0, 5);

      return {
        liquid: liquidSuggestions,
        medium: mediumSuggestions,
        opportunity: opportunitySuggestions
      };
  }, [filteredItems, slots, remainingBudget]);

  const handleAssign = (slotId, item) => {
    // Recalculate remaining budget at assignment time to ensure we respect current budget
    const currentRemainingBudget = remainingBudget;
    const costPerItem = item.suggestedBuy || item.buyPrice;
    const profitPerItem = item.suggestedProfit || item.netProfit;
    
    // If budget is set and already exceeded or at zero, prevent assignment
    if (availableGold && currentRemainingBudget !== null && currentRemainingBudget <= 0) {
      alert(`Cannot assign: Your budget has been exceeded. Remaining budget: ${currentRemainingBudget.toLocaleString()}gp`);
      return;
    }
    
    // Find the slot type to determine the suggested percentage
    const targetSlot = slots.find(s => s.id === slotId);
    const slotType = targetSlot?.type || 'medium';
    const suggestedPercent = slotType === 'liquid' ? 0.8 : (slotType === 'medium' ? 0.5 : 0.3);
    
    // Calculate affordable quantity based on current remaining budget
    let suggestedVol;
    if (currentRemainingBudget === null) {
      // No budget constraint - use buy limit percentage
      suggestedVol = Math.floor((item.buyLimit || 100) * suggestedPercent);
    } else {
      // Budget constraint - ensure we don't exceed remaining budget
      if (costPerItem > currentRemainingBudget) {
        // Can't afford even 1 item
        alert(`Cannot assign: ${item.name} costs ${costPerItem.toLocaleString()}gp but only ${currentRemainingBudget.toLocaleString()}gp remaining in budget.`);
        return;
      }
      
      const suggestedVolFromLimit = Math.floor((item.buyLimit || 100) * suggestedPercent);
      const maxAffordable = Math.floor(currentRemainingBudget / costPerItem);
      const maxForDiv = Math.floor((currentRemainingBudget * 0.3) / costPerItem);
      suggestedVol = Math.max(1, Math.min(suggestedVolFromLimit, maxAffordable, maxForDiv));
    }
    
    const totalCost = suggestedVol * costPerItem;
    
    // Final check: ensure total cost doesn't exceed remaining budget
    if (currentRemainingBudget !== null && totalCost > currentRemainingBudget) {
      // Adjust quantity to fit within budget
      suggestedVol = Math.floor(currentRemainingBudget / costPerItem);
      if (suggestedVol < 1) {
        alert(`Cannot assign: ${item.name} would exceed your remaining budget of ${currentRemainingBudget.toLocaleString()}gp.`);
        return;
      }
      // Recalculate totalCost with adjusted quantity
      const adjustedTotalCost = suggestedVol * costPerItem;
      onAssignToSlot(slotId, {
        ...item,
        recommendedQty: suggestedVol,
        potentialProfit: profitPerItem * suggestedVol,
        totalCost: adjustedTotalCost
      });
      return;
    }
    
    onAssignToSlot(slotId, {
      ...item,
      recommendedQty: suggestedVol,
      potentialProfit: profitPerItem * suggestedVol,
      totalCost: totalCost
    });
  };

  const renderSuggestionCard = (item, slotType) => {
    const emptySlots = slots.filter(s => s.type === slotType && !s.item);
    if (emptySlots.length === 0) return null;

    return (
      <div
        key={item.id}
        style={{
          padding: '14px 16px',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid #4d3d2d',
          borderRadius: 4
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img 
              src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon?.replace(/ /g, '_') || item.name.replace(/ /g, '_'))}.png`}
              alt="" style={{ width: 28, height: 28 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f5ead6' }}>{item.name}</div>
          </div>
          <select
            className="input-field"
            style={{ padding: '6px 8px', fontSize: 13, width: 80 }}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                handleAssign(parseInt(e.target.value), item);
                e.target.value = '';
              }
            }}
          >
            <option value="">+ Slot</option>
            {emptySlots.map(s => (
              <option key={s.id} value={s.id}>Slot {s.id}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
          <div style={{ color: '#b8a88a' }}>📦 Buy: <span style={{ 
            color: slotType === 'liquid' ? '#e9d5ff' : slotType === 'medium' ? '#fde68a' : '#a7f3d0', 
            fontWeight: 600 
          }}>{item.affordableQty?.toLocaleString() || 0}</span></div>
          <div style={{ color: '#b8a88a' }}>💰 Cost: <span style={{ color: '#f5ead6' }}>{formatGp(item.estimatedCost || 0)}</span></div>
          <div style={{ color: '#b8a88a' }}>📈 Profit: <span style={{ color: '#6ee7a0', fontWeight: 600 }}>+{formatGp(item.potentialProfit || (item.suggestedProfit || item.netProfit) * (item.affordableQty || 0))}</span></div>
          <div style={{ color: '#b8a88a' }}>
            {slotType === 'liquid' ? '⚡' : slotType === 'medium' ? '📊' : '📊'} 
            <span style={{ color: '#d4c4a4' }}>
              {slotType === 'liquid' ? ` ${formatNumber(item.volume)}/day` : ` ${item.spreadPercent?.toFixed(1) || 0}% spread`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const hasSuggestions = suggestions.liquid.length > 0 || suggestions.medium.length > 0 || suggestions.opportunity.length > 0;

  if (!hasSuggestions) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#8b7355', fontSize: 14 }}>
        No suggestions available. Try adjusting filters in the Item Finder.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div className="ornament" style={{ margin: '24px 0' }}>→ → →</div>
      <h3 style={{ margin: '0 0 12px 0', color: '#f5d77a', fontSize: 22 }}>💡 Recommended Items</h3>
      <p style={{ margin: '0 0 20px 0', fontSize: 14, color: '#b8a88a', fontFamily: '"Crimson Text", serif' }}>
        {availableGold ? (
          <>
            Purchase volumes based on <span style={{ color: remainingBudget > 0 ? '#6ee7a0' : '#fca5a5', fontWeight: 600 }}>{formatGp(remainingBudget || 0)}</span> remaining
            {slotStats?.totalCost > 0 && (
              <span style={{ color: '#9a8a6a' }}> ({formatGp(parseFloat(availableGold))} total ↑ {formatGp(slotStats.totalCost)} in slots)</span>
            )}
            <span style={{ color: '#9a8a6a' }}> • max 30% per item</span>
          </>
        ) : (
          'Enter gold amount above for personalized purchase suggestions'
        )}
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Liquid Recommendations */}
        <div>
          <div className="slot-type-badge slot-type-liquid" style={{ marginBottom: 16, padding: '6px 12px', fontSize: 13 }}>For Liquid Slots</div>
          {suggestions.liquid.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suggestions.liquid.slice(0, 5).map(item => renderSuggestionCard(item, 'liquid'))}
            </div>
          ) : (
            <div style={{ color: '#8b7355', fontSize: 14, padding: 16 }}>No recommendations available</div>
          )}
        </div>

        {/* Medium Recommendations */}
        <div>
          <div className="slot-type-badge slot-type-medium" style={{ marginBottom: 16, padding: '6px 12px', fontSize: 13 }}>For Medium Slots</div>
          {suggestions.medium.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suggestions.medium.slice(0, 5).map(item => renderSuggestionCard(item, 'medium'))}
            </div>
          ) : (
            <div style={{ color: '#8b7355', fontSize: 14, padding: 16 }}>No recommendations available</div>
          )}
        </div>

        {/* Opportunity Recommendations */}
        <div>
          <div className="slot-type-badge slot-type-opportunity" style={{ marginBottom: 16, padding: '6px 12px', fontSize: 13 }}>For Opportunity Slot</div>
          {suggestions.opportunity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suggestions.opportunity.slice(0, 5).map(item => renderSuggestionCard(item, 'opportunity'))}
            </div>
          ) : (
            <div style={{ color: '#8b7355', fontSize: 14, padding: 16 }}>No recommendations available</div>
          )}
        </div>
      </div>
    </div>
  );
}
