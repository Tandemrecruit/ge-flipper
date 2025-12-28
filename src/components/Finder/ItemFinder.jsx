import React, { useState, useEffect } from 'react';
import { useItems } from '../../hooks/useItems';
import Filters from './Filters';
import ItemTable from './ItemTable';
import ItemDetailModal from './ItemDetailModal';

export default function ItemFinder({ 
  prices, 
  volumes, 
  mapping, 
  loading, 
  lastUpdate, 
  apiSource, 
  usingSampleData, 
  error,
  onRefresh,
  onTrackFlip,
  onAssignToSlot,
  availableSlots,
  availableGold,
  onAvailableGoldChange,
  autoRefreshInterval
}) {
  const [filters, setFilters] = useState({
    minProfit: 1000,
    minRoi: 1,
    searchTerm: '',
    showSafeOnly: true,
    sortBy: 'profit',
    sortAsc: false,
    availableGold: availableGold || ''
  });

  // Sync local filters.availableGold with parent availableGold prop
  useEffect(() => {
    setFilters(prev => {
      // Only update if the prop value is different from current state
      if (availableGold !== prev.availableGold) {
        return { ...prev, availableGold: availableGold || '' };
      }
      return prev;
    });
  }, [availableGold]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('profit');
  const [sortAsc, setSortAsc] = useState(false);

  const { filteredItems } = useItems(prices, volumes, mapping, { ...filters, sortBy, sortAsc });

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // Update parent state when availableGold changes
    if (newFilters.availableGold !== filters.availableGold && onAvailableGoldChange) {
      onAvailableGoldChange(newFilters.availableGold);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  const handleAssignToSlot = (slotId, item, gold) => {
    // Find slot from availableSlots (which is the full slots array from App.jsx)
    // availableSlots prop contains all slots, not filtered
    const slot = availableSlots?.find(s => s.id === slotId);
    const userGold = gold ? parseFloat(gold) : (availableGold ? parseFloat(availableGold) : null);
    let suggestedPercent = slot?.type === 'liquid' ? 0.8 : (slot?.type === 'medium' ? 0.5 : 0.3);
    let suggestedVol = Math.floor((item.buyLimit || 100) * suggestedPercent);
    if (userGold) {
      const costPerItem = item.suggestedBuy || item.buyPrice;
      const maxAffordable = Math.floor(userGold / costPerItem);
      const maxForDiv = Math.floor((userGold * 0.3) / costPerItem);
      suggestedVol = Math.min(suggestedVol, maxAffordable, maxForDiv);
    }
    suggestedVol = Math.max(1, suggestedVol);
    const profitPerItem = item.suggestedProfit || item.netProfit;
    const costPerItem = item.suggestedBuy || item.buyPrice;
    
    // Call the parent's onAssignToSlot which will call assignToSlot from useSlots hook
    onAssignToSlot(slotId, {
      ...item,
      recommendedQty: suggestedVol,
      potentialProfit: suggestedVol * profitPerItem,
      totalCost: suggestedVol * costPerItem
    });
  };

  return (
    <>
      <Filters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        lastUpdate={lastUpdate}
        apiSource={apiSource}
        usingSampleData={usingSampleData}
        itemsCount={filteredItems.length}
        onRefresh={onRefresh}
        loading={loading}
        availableGold={availableGold}
        autoRefreshInterval={autoRefreshInterval}
      />

      {error && (
        <div className={`info-banner ${usingSampleData ? 'info-banner-warning' : 'info-banner-error'}`} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15 }}>{error}</div>
        </div>
      )}

      <ItemTable
        items={filteredItems}
        loading={loading}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSort={handleSort}
        onItemClick={setSelectedItem}
        onTrackFlip={onTrackFlip}
        onAssignToSlot={handleAssignToSlot}
        availableSlots={availableSlots?.filter(s => !s.item)}
      />

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onTrackFlip={onTrackFlip}
          onAssignToSlot={handleAssignToSlot}
          availableSlots={availableSlots?.filter(s => !s.item)}
          availableGold={availableGold}
        />
      )}
    </>
  );
}
