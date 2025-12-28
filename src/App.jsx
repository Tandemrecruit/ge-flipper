import React, { useState } from 'react';
import { usePrices } from './hooks/usePrices';
import { useSlots } from './hooks/useSlots';
import { useFlipTracker } from './hooks/useFlipTracker';
import Header from './components/Layout/Header';
import TabBar from './components/Layout/TabBar';
import Footer from './components/Layout/Footer';
import ItemFinder from './components/Finder/ItemFinder';
import SlotAllocation from './components/Slots/SlotAllocation';
import FlipTracker from './components/Tracker/FlipTracker';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import AutoRefreshSettings from './components/Settings/AutoRefreshSettings';
import './styles/globals.css';

export default function GEFlipper() {
  const [activeTab, setActiveTab] = useState('finder');
  const [availableGold, setAvailableGold] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(60000);

  const { prices, volumes, mapping, loading, apiSource, usingSampleData, error, lastUpdate, refreshPrices } = usePrices(autoRefreshInterval);
  const { slots, slotStats, assignToSlot, clearSlot, updateSlotQuantity, changeSlotType, setSlots, isSlotFilled } = useSlots();
  const { flipLog, addFlip, itemAnalytics } = useFlipTracker();

  const handleTrackFlip = (item) => {
    addFlip(item);
    setActiveTab('tracker');
  };

  const handleAssignToSlot = (slotId, item) => {
    assignToSlot(slotId, item);
    setActiveTab('slots');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #151210 0%, #1f1a14 50%, #151210 100%)',
      fontFamily: '"Cinzel", "Times New Roman", serif',
      color: '#f5ead6',
      padding: '20px'
    }}>
      <Header />

      <TabBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        slotStats={slotStats}
        flipLogLength={flipLog.length}
      />

      {activeTab === 'finder' && (
        <ItemFinder
          prices={prices}
          volumes={volumes}
          mapping={mapping}
          loading={loading}
          lastUpdate={lastUpdate}
          apiSource={apiSource}
          usingSampleData={usingSampleData}
          error={error}
          onRefresh={refreshPrices}
          onTrackFlip={handleTrackFlip}
          onAssignToSlot={handleAssignToSlot}
          availableSlots={slots}
          availableGold={availableGold}
          onAvailableGoldChange={setAvailableGold}
        />
      )}

      {activeTab === 'slots' && (
        <SlotAllocation
          prices={prices}
          volumes={volumes}
          mapping={mapping}
          availableGold={availableGold}
          slots={slots}
          slotStats={slotStats}
          assignToSlot={assignToSlot}
          clearSlot={clearSlot}
          updateSlotQuantity={updateSlotQuantity}
          changeSlotType={changeSlotType}
          setSlots={setSlots}
          isSlotFilled={isSlotFilled}
          onTrackFlip={handleTrackFlip}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === 'tracker' && (
        <FlipTracker />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsDashboard
          prices={prices}
          volumes={volumes}
          mapping={mapping}
          flipLog={flipLog}
          itemAnalytics={itemAnalytics}
          onTrackFlip={handleTrackFlip}
          onAssignToSlot={handleAssignToSlot}
        />
      )}

      {activeTab === 'settings' && (
        <AutoRefreshSettings onIntervalChange={setAutoRefreshInterval} />
      )}

      <Footer />
                                </div>
  );
}
