import React, { useState, useRef } from 'react';
import { useFlipTracker } from '../../hooks/useFlipTracker';
import FlipStats from './FlipStats';
import AddFlipForm from './AddFlipForm';
import FlipList from './FlipList';
import ItemAnalytics from './ItemAnalytics';
import SplitSaleModal from './SplitSaleModal';
import AddSaleModal from './AddSaleModal';
import EditBuyPriceModal from './EditBuyPriceModal';
import { exportFlipsToCSV, importFlipsFromCSV, downloadCSV, readCSVFile } from '../../utils/csv';

export default function FlipTracker() {
  const {
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
  } = useFlipTracker();

  const [splitModalFlip, setSplitModalFlip] = useState(null);
  const [addSaleModalFlip, setAddSaleModalFlip] = useState(null);
  const [editBuyPriceModalFlip, setEditBuyPriceModalFlip] = useState(null);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpdateSale = (flipId) => {
    const flip = flipLog.find(f => f.id === flipId);
    if (flip) {
      setAddSaleModalFlip(flip);
    }
  };

  const handleAddSaleConfirm = (flipId, sellPrice, soldQty, isNet) => {
    const flip = flipLog.find(f => f.id === flipId);

    // If partial sale (soldQty provided and less than total), use splitFlip
    if (soldQty !== null && flip && soldQty < flip.quantity) {
      splitFlip(flipId, soldQty, sellPrice, isNet);
    } else {
      // Full sale - use standard update
      updateFlipSale(flipId, sellPrice, soldQty, isNet);
    }

    setAddSaleModalFlip(null);
  };

  const handleSplitSale = (flipId) => {
    const flip = flipLog.find(f => f.id === flipId);
    if (flip) {
      setSplitModalFlip(flip);
    }
  };

  const handleSplitConfirm = (flipId, splitQty, sellPrice, isNet) => {
    splitFlip(flipId, splitQty, sellPrice, isNet);
    setSplitModalFlip(null);
  };

  const handleEditBuyPrice = (flipId) => {
    const flip = flipLog.find(f => f.id === flipId);
    if (flip) {
      setEditBuyPriceModalFlip(flip);
    }
  };

  const handleEditBuyPriceConfirm = (flipId, updates, sellPriceIsNet = true) => {
    editFlip(flipId, updates, sellPriceIsNet);
    setEditBuyPriceModalFlip(null);
  };

  const handleCancel = () => {
    setNewFlip({ itemId: '', itemName: '', buyPrice: '', sellPrice: '', quantity: '', expectedProfit: 0, suggestedSell: 0, suggestedBuy: 0, sellPriceIsNet: true });
  };

  const handleNewEntry = () => {
    setNewFlip({ itemId: '', itemName: '', buyPrice: '', sellPrice: '', quantity: '', expectedProfit: 0, suggestedSell: 0, suggestedBuy: 0, sellPriceIsNet: true });
  };

  const handleSave = () => {
    saveFlip();
    // saveFlip already clears the form, so after saving it will show the manual entry form again
  };

  const handleExportCSV = () => {
    if (flipLog.length === 0) {
      alert('No flip data to export');
      return;
    }
    
    const csvContent = exportFlipsToCSV(flipLog);
    const filename = `ge-flips-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const processCSVFile = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    try {
      const csvContent = await readCSVFile(file);
      const importedFlips = importFlipsFromCSV(csvContent);
      
      if (importedFlips.length === 0) {
        alert('No valid flip data found in CSV file');
        return;
      }

      const confirmMessage = `Import ${importedFlips.length} flip(s)?\n\nThis will ${flipLog.length > 0 ? 'replace' : 'set'} your current flip log.`;
      if (window.confirm(confirmMessage)) {
        setFlipLog(importedFlips);
        alert(`Successfully imported ${importedFlips.length} flip(s)`);
      }
    } catch (error) {
      alert(`Error importing CSV: ${error.message}`);
      console.error('CSV import error:', error);
    } finally {
      // Reset file input
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
        <h2 style={{ margin: 0, fontSize: 24, color: '#f5ead6' }}>Flip Tracker</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn"
            onClick={handleExportCSV}
            disabled={flipLog.length === 0}
            style={{ 
              padding: '8px 16px', 
              fontSize: 13,
              opacity: flipLog.length === 0 ? 0.5 : 1,
              cursor: flipLog.length === 0 ? 'not-allowed' : 'pointer'
            }}
            title={flipLog.length === 0 ? 'No data to export' : 'Export flips to CSV'}
          >
            📥 Export CSV
          </button>
          <button
            className="btn"
            onClick={handleImportCSV}
            style={{ padding: '8px 16px', fontSize: 13 }}
            title="Import flips from CSV (or drag and drop a CSV file)"
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

      <FlipStats flipStats={flipStats} />
      
      {newFlip.itemName && (
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn" 
            onClick={handleNewEntry}
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            + Add New Entry
          </button>
        </div>
      )}
      
      <AddFlipForm
        newFlip={newFlip}
        setNewFlip={setNewFlip}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <FlipList
        flipLog={flipLog}
        onUpdateSale={handleUpdateSale}
        onDelete={deleteFlip}
        onEdit={handleEditBuyPrice}
        onSplitSale={handleSplitSale}
      />

      {splitModalFlip && (
        <SplitSaleModal
          flip={splitModalFlip}
          onClose={() => setSplitModalFlip(null)}
          onSplit={handleSplitConfirm}
        />
      )}

      {addSaleModalFlip && (
        <AddSaleModal
          flip={addSaleModalFlip}
          onClose={() => setAddSaleModalFlip(null)}
          onConfirm={handleAddSaleConfirm}
        />
      )}

      {editBuyPriceModalFlip && (
        <EditBuyPriceModal
          flip={editBuyPriceModalFlip}
          onClose={() => setEditBuyPriceModalFlip(null)}
          onConfirm={handleEditBuyPriceConfirm}
        />
      )}

      <ItemAnalytics 
        itemAnalytics={itemAnalytics}
        topPerformers={topPerformers}
      />
    </div>
  );
}
