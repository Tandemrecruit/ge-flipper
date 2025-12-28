import React, { useRef, useState, useEffect } from 'react';
import { formatGp } from '../../utils/formatters';
import SlotStrategy from './SlotStrategy';
import SlotGrid from './SlotGrid';
import SlotSuggestions from './SlotSuggestions';
import { exportSlotsToCSV, importSlotsFromCSV, downloadCSV, readCSVFile } from '../../utils/csv';

export default function SlotAllocation({ 
  prices, 
  volumes, 
  mapping, 
  availableGold, 
  slots,
  slotStats,
  assignToSlot,
  clearSlot,
  updateSlotQuantity,
  changeSlotType,
  setSlots,
  isSlotFilled,
  onTrackFlip, 
  onTabChange
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Safety check
  if (!slots || !Array.isArray(slots)) {
    return (
      <div className="gold-border" style={{ padding: 24 }}>
        <div style={{ textAlign: 'center', color: '#8b7355', padding: 40 }}>
          Loading slots...
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (slots.length === 0) {
      alert('No slot data to export');
      return;
    }
    
    const csvContent = exportSlotsToCSV(slots);
    const filename = `ge-slots-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const processCSVFile = async (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    try {
      const csvContent = await readCSVFile(file);
      const importedSlots = importSlotsFromCSV(csvContent);
      
      if (importedSlots.length === 0) {
        alert('No valid slot data found in CSV file');
        return;
      }

      const confirmMessage = `Import ${importedSlots.length} slot(s)?\n\nThis will ${slots.length > 0 ? 'replace' : 'set'} your current slot allocation.`;
      if (window.confirm(confirmMessage)) {
        setSlots(importedSlots);
        alert(`Successfully imported ${importedSlots.length} slot(s)`);
      }
    } catch (error) {
      alert(`Error importing CSV: ${error.message}`);
      console.error('CSV import error:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    await processCSVFile(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    await processCSVFile(file);
  };


  return (
    <div 
      className="gold-border" 
      style={{ padding: 24 }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          border: '3px dashed #d4a84b',
          borderRadius: 8
        }}>
          <div style={{
            textAlign: 'center',
            color: '#f5ead6',
            fontSize: 24,
            fontWeight: 600
          }}>
            📁 Drop CSV file here to import
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: '#f5ead6' }}>Slot Allocation</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn"
            onClick={handleExportCSV}
            disabled={slots.length === 0}
            style={{ 
              padding: '8px 16px', 
              fontSize: 13,
              opacity: slots.length === 0 ? 0.5 : 1,
              cursor: slots.length === 0 ? 'not-allowed' : 'pointer'
            }}
            title={slots.length === 0 ? 'No data to export' : 'Export slots to CSV'}
          >
            📥 Export CSV
          </button>
          <button
            className="btn"
            onClick={handleImportCSV}
            style={{ padding: '8px 16px', fontSize: 13 }}
            title="Import slots from CSV (or drag and drop a CSV file)"
          >
            📤 Import CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <SlotStrategy />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="detail-box" style={{ textAlign: 'center' }}>
          <div className="detail-label">Slots Filled</div>
          <div className="detail-value">{slotStats?.filled || 0}/{slotStats?.total || 0}</div>
        </div>
        <div className="detail-box" style={{ textAlign: 'center' }}>
          <div className="detail-label">Liquid</div>
          <div className="detail-value" style={{ color: '#c084fc' }}>
            {(() => {
              try {
                const liquidSlots = slotStats?.byType?.liquid;
                if (liquidSlots && Array.isArray(liquidSlots)) {
                  const filled = liquidSlots.filter(isSlotFilled).length;
                  return `${filled}/${liquidSlots.length}`;
                }
                return '0/0';
              } catch (e) {
                return '0/0';
              }
            })()}
          </div>
        </div>
        <div className="detail-box" style={{ textAlign: 'center' }}>
          <div className="detail-label">Medium</div>
          <div className="detail-value" style={{ color: '#fbbf24' }}>
            {(() => {
              try {
                const mediumSlots = slotStats?.byType?.medium;
                if (mediumSlots && Array.isArray(mediumSlots)) {
                  const filled = mediumSlots.filter(isSlotFilled).length;
                  return `${filled}/${mediumSlots.length}`;
                }
                return '0/0';
              } catch (e) {
                return '0/0';
              }
            })()}
          </div>
        </div>
        <div className="detail-box" style={{ textAlign: 'center' }}>
          <div className="detail-label">Opportunity</div>
          <div className="detail-value" style={{ color: '#4ade80' }}>
            {(() => {
              try {
                const oppSlots = slotStats?.byType?.opportunity;
                if (oppSlots && Array.isArray(oppSlots)) {
                  const filled = oppSlots.filter(isSlotFilled).length;
                  return `${filled}/${oppSlots.length}`;
                }
                return '0/0';
              } catch (e) {
                return '0/0';
              }
            })()}
          </div>
        </div>
        <div className="detail-box" style={{ textAlign: 'center' }}>
          <div className="detail-label">Committed</div>
          <div className="detail-value" style={{ color: availableGold && (slotStats?.totalCost || 0) > parseFloat(availableGold) ? '#fca5a5' : '#f5ead6' }}>
            {formatGp(slotStats?.totalCost || 0)}
          </div>
        </div>
        {availableGold && (
          <div className="detail-box" style={{ textAlign: 'center' }}>
            <div className="detail-label">Remaining</div>
            <div className="detail-value" style={{ color: (parseFloat(availableGold) || 0) - (slotStats?.totalCost || 0) < 0 ? '#fca5a5' : '#6ee7a0' }}>
              {formatGp((parseFloat(availableGold) || 0) - (slotStats?.totalCost || 0))}
            </div>
          </div>
        )}
        <div className="detail-box" style={{ textAlign: 'center' }}>
          <div className="detail-label">Est. Profit</div>
          <div className="detail-value profit-positive">+{formatGp(slotStats?.totalPotentialProfit || 0)}</div>
        </div>
      </div>

      <SlotGrid
        slots={slots}
        onUpdateQuantity={updateSlotQuantity}
        onChangeType={changeSlotType}
        onClear={clearSlot}
        onTrackFlip={(item) => {
          if (onTrackFlip) onTrackFlip(item);
          if (onTabChange) onTabChange('tracker');
        }}
      />

      {prices && volumes && mapping && (
        <SlotSuggestions
          prices={prices}
          volumes={volumes}
          mapping={mapping}
          availableGold={availableGold}
          slots={slots}
          slotStats={slotStats}
          onAssignToSlot={(slotId, item) => {
            assignToSlot(slotId, item);
          }}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
}
