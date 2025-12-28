/**
 * CSV Import/Export utilities for GE Flipper
 */
import { calculateTax, netToGross } from './calculations';

/**
 * Convert flip log data to CSV format
 * @param {Array} flipLog - Array of flip objects
 * @returns {string} CSV string
 */
export const exportFlipsToCSV = (flipLog) => {
  if (!flipLog || flipLog.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Item ID',
    'Item Name',
    'Buy Price',
    'Sell Price (Gross)',
    'Sell Price (Net)',
    'Suggested Buy',
    'Suggested Sell',
    'Quantity',
    'Expected Profit',
    'Actual Profit',
    'Tax',
    'Status',
    'Date',
    'Split From'
  ];

  // Convert each flip to CSV row
  const rows = flipLog.map(flip => [
    flip.id || '',
    flip.itemId || '',
    escapeCSV(flip.itemName || ''),
    flip.buyPrice || '',
    flip.sellPrice || '',
    flip.netSellPrice || '',
    flip.suggestedBuy || '',
    flip.suggestedSell || '',
    flip.quantity || '',
    flip.expectedProfit || '',
    flip.actualProfit !== null && flip.actualProfit !== undefined ? flip.actualProfit : '',
    flip.tax || '',
    flip.status || '',
    flip.date || '',
    flip.splitFrom || ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => formatCSVCell(cell)).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Parse CSV string to flip log data
 * @param {string} csvString - CSV content
 * @returns {Array} Array of flip objects
 */
export const importFlipsFromCSV = (csvString) => {
  if (!csvString || csvString.trim() === '') {
    return [];
  }

  const lines = csvString.trim().split('\n');
  
  // Find the header row (skip comment lines starting with #)
  let headerLineIndex = -1;
  let headers = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#')) {
      headers = parseCSVLine(line);
      headerLineIndex = i;
      break;
    }
  }

  if (headers.length === 0) {
    throw new Error('Could not find header row in CSV file');
  }

  const headerMap = {};
  const normalizedHeaderMap = {}; // For case-insensitive matching
  
  headers.forEach((header, index) => {
    const trimmed = header.trim();
    headerMap[trimmed] = index;
    normalizedHeaderMap[trimmed.toLowerCase()] = { original: trimmed, index };
  });

  // Helper to find header index (case-insensitive)
  const findHeaderIndex = (headerName) => {
    const normalized = headerName.toLowerCase();
    return normalizedHeaderMap[normalized]?.index;
  };

  // Check if this is the alternative format (name, date, quantity, price, state)
  const hasAlternativeFormat = findHeaderIndex('name') !== undefined && 
                                findHeaderIndex('price') !== undefined && 
                                findHeaderIndex('state') !== undefined;

  // Validate required headers (case-insensitive)
  // Support both formats: standard (Item Name, Buy Price, Quantity) and alternative (name, price, state, quantity)
  let requiredHeaders;
  if (hasAlternativeFormat) {
    requiredHeaders = ['name', 'price', 'quantity'];
  } else {
    requiredHeaders = ['Item Name', 'Buy Price', 'Quantity'];
  }
  
  const missingHeaders = requiredHeaders.filter(h => findHeaderIndex(h) === undefined);
  if (missingHeaders.length > 0) {
    const foundHeaders = headers.map(h => h.trim()).join(', ');
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}\n\nFound headers: ${foundHeaders}\n\nPlease ensure your CSV has the required columns.`);
  }

  // Parse data rows - collect all entries first
  const rawEntries = [];
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue; // Skip empty lines and comments
    
    const values = parseCSVLine(line);
    
    // Extract values using header map (case-insensitive)
    const getValue = (headerName) => {
      const idx = findHeaderIndex(headerName);
      return idx !== undefined ? values[idx] : undefined;
    };

    if (hasAlternativeFormat) {
      // Alternative format: name, date, quantity, price, state
      const itemName = getValue('name')?.trim() || '';
      const price = parseFloat(getValue('price')) || 0;
      const quantity = parseInt(getValue('quantity')) || 1;
      const state = getValue('state')?.trim().toUpperCase() || '';
      const dateStr = getValue('date')?.trim() || '';
      
      if (!itemName || quantity <= 0) {
        console.warn(`Skipping invalid row ${i + 1}: missing required fields`);
        continue;
      }
      
      // Parse date - handle formats like "2025-12-27 11:55 PM"
      let date = new Date().toISOString();
      if (dateStr) {
        try {
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString();
          }
        } catch (e) {
          // Keep default date if parsing fails
        }
      }
      
      const isBought = state === 'BOUGHT' || state === 'BUY';
      const isSold = state === 'SOLD' || state === 'SELL';
      
      if (isBought || isSold) {
        rawEntries.push({
          itemName,
          price,
          quantity,
          state: isBought ? 'BOUGHT' : 'SOLD',
          date,
          rowIndex: i
        });
      }
    } else {
      // Standard format - process as before
      const itemName = getValue('Item Name')?.trim() || getValue('name')?.trim() || '';
      const quantity = parseInt(getValue('Quantity')) || parseInt(getValue('quantity')) || 1;
      
      if (!itemName || quantity <= 0) {
        console.warn(`Skipping invalid row ${i + 1}: missing required fields`);
        continue;
      }
      
      const flip = {
        id: getValue('ID') ? parseInt(getValue('ID')) : Date.now() + i,
        itemId: getValue('Item ID') ? parseInt(getValue('Item ID')) : null,
        itemName: itemName,
        buyPrice: parseFloat(getValue('Buy Price')) || parseFloat(getValue('price')) || 0,
        sellPrice: getValue('Sell Price (Gross)') ? parseFloat(getValue('Sell Price (Gross)')) : null,
        netSellPrice: getValue('Sell Price (Net)') ? parseFloat(getValue('Sell Price (Net)')) : null,
        suggestedBuy: getValue('Suggested Buy') ? parseFloat(getValue('Suggested Buy')) : null,
        suggestedSell: getValue('Suggested Sell') ? parseFloat(getValue('Suggested Sell')) : null,
        quantity: quantity,
        expectedProfit: getValue('Expected Profit') ? parseFloat(getValue('Expected Profit')) : null,
        actualProfit: getValue('Actual Profit') !== undefined && getValue('Actual Profit') !== '' 
          ? parseFloat(getValue('Actual Profit')) 
          : null,
        tax: getValue('Tax') ? parseFloat(getValue('Tax')) : 0,
        status: getValue('Status')?.trim() || getValue('state')?.trim().toLowerCase() || 'pending',
        date: getValue('Date')?.trim() || getValue('date')?.trim() || new Date().toISOString(),
        splitFrom: getValue('Split From') ? parseInt(getValue('Split From')) : null
      };
      
      rawEntries.push({ flip, rowIndex: i });
    }
  }

  // If using alternative format, merge matching buy/sell entries
  if (hasAlternativeFormat) {
    // Group entries by item name
    const itemGroups = {};
    rawEntries.forEach(entry => {
      const key = entry.itemName.toLowerCase();
      if (!itemGroups[key]) {
        itemGroups[key] = { bought: [], sold: [] };
      }
      if (entry.state === 'BOUGHT') {
        itemGroups[key].bought.push(entry);
      } else {
        itemGroups[key].sold.push(entry);
      }
    });

    const flips = [];
    let flipIdCounter = Date.now();

    // Process each item group
    Object.values(itemGroups).forEach(({ bought, sold }) => {
      // Sort by date (oldest first)
      bought.sort((a, b) => new Date(a.date) - new Date(b.date));
      sold.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Match bought and sold entries
      const usedBought = new Set();
      const usedSold = new Set();

      // First pass: match exact quantity matches
      for (let i = 0; i < bought.length; i++) {
        if (usedBought.has(i)) continue;
        
        for (let j = 0; j < sold.length; j++) {
          if (usedSold.has(j)) continue;
          
          if (bought[i].quantity === sold[j].quantity) {
            // Perfect match - merge them
            const buyEntry = bought[i];
            const sellEntry = sold[j];
            
            // Assume sell price is net (from GE history)
            const netSellPrice = sellEntry.price;
            const grossSellPrice = netToGross(netSellPrice);
            const taxPerItem = grossSellPrice - netSellPrice;
            const tax = taxPerItem * sellEntry.quantity;
            const actualProfit = (netSellPrice - buyEntry.price) * sellEntry.quantity;
            
            flips.push({
              id: flipIdCounter++,
              itemId: null,
              itemName: buyEntry.itemName,
              buyPrice: buyEntry.price,
              sellPrice: grossSellPrice,
              netSellPrice: netSellPrice,
              suggestedBuy: null,
              suggestedSell: null,
              quantity: buyEntry.quantity,
              expectedProfit: null,
              actualProfit: actualProfit,
              tax: tax,
              status: 'complete',
              date: buyEntry.date, // Use buy date
              splitFrom: null
            });
            
            usedBought.add(i);
            usedSold.add(j);
            break;
          }
        }
      }

      // Second pass: match remaining entries with closest quantity
      for (let i = 0; i < bought.length; i++) {
        if (usedBought.has(i)) continue;
        
        let bestMatch = null;
        let bestMatchIndex = -1;
        let bestQuantityDiff = Infinity;
        
        for (let j = 0; j < sold.length; j++) {
          if (usedSold.has(j)) continue;
          
          const quantityDiff = Math.abs(bought[i].quantity - sold[j].quantity);
          if (quantityDiff < bestQuantityDiff) {
            bestQuantityDiff = quantityDiff;
            bestMatch = sold[j];
            bestMatchIndex = j;
          }
        }
        
        if (bestMatch && bestQuantityDiff <= Math.min(bought[i].quantity, bestMatch.quantity) * 0.5) {
          // Match if quantities are within 50% of each other
          const buyEntry = bought[i];
          const sellEntry = bestMatch;
          const matchedQty = Math.min(buyEntry.quantity, sellEntry.quantity);
          
          const netSellPrice = sellEntry.price;
          const grossSellPrice = netToGross(netSellPrice);
          const taxPerItem = grossSellPrice - netSellPrice;
          const tax = taxPerItem * matchedQty;
          const actualProfit = (netSellPrice - buyEntry.price) * matchedQty;
          
          flips.push({
            id: flipIdCounter++,
            itemId: null,
            itemName: buyEntry.itemName,
            buyPrice: buyEntry.price,
            sellPrice: grossSellPrice,
            netSellPrice: netSellPrice,
            suggestedBuy: null,
            suggestedSell: null,
            quantity: matchedQty,
            expectedProfit: null,
            actualProfit: actualProfit,
            tax: tax,
            status: 'complete',
            date: buyEntry.date,
            splitFrom: null
          });
          
          usedBought.add(i);
          usedSold.add(bestMatchIndex);
          
          // Handle remaining quantities
          if (buyEntry.quantity > matchedQty) {
            bought.push({
              ...buyEntry,
              quantity: buyEntry.quantity - matchedQty
            });
          }
          if (sellEntry.quantity > matchedQty) {
            sold.push({
              ...sellEntry,
              quantity: sellEntry.quantity - matchedQty
            });
          }
        }
      }

      // Add unmatched bought entries as pending
      bought.forEach((entry, i) => {
        if (!usedBought.has(i)) {
          flips.push({
            id: flipIdCounter++,
            itemId: null,
            itemName: entry.itemName,
            buyPrice: entry.price,
            sellPrice: null,
            netSellPrice: null,
            suggestedBuy: null,
            suggestedSell: null,
            quantity: entry.quantity,
            expectedProfit: null,
            actualProfit: null,
            tax: 0,
            status: 'pending',
            date: entry.date,
            splitFrom: null
          });
        }
      });
    });

    return flips;
  } else {
    // Standard format - return as is
    return rawEntries.map(entry => entry.flip);
  }
};

/**
 * Convert slots data to CSV format
 * @param {Array} slots - Array of slot objects
 * @returns {string} CSV string
 */
export const exportSlotsToCSV = (slots) => {
  if (!slots || slots.length === 0) {
    return '';
  }

  const headers = [
    'Slot ID',
    'Slot Type',
    'Slot Label',
    'Item ID',
    'Item Name',
    'Buy Price',
    'Sell Price',
    'Suggested Buy',
    'Suggested Sell',
    'Suggested Profit',
    'Net Profit',
    'Spread Percent',
    'Volume',
    'Buy Limit',
    'Recommended Qty',
    'Potential Profit',
    'Total Cost',
    'Assigned At'
  ];

  const rows = slots.map(slot => {
    if (!slot.item) {
      return [
        slot.id || '',
        slot.type || '',
        slot.label || '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', ''
      ];
    }

    return [
      slot.id || '',
      slot.type || '',
      slot.label || '',
      slot.item.id || '',
      escapeCSV(slot.item.name || ''),
      slot.item.buyPrice || '',
      slot.item.sellPrice || '',
      slot.item.suggestedBuy || '',
      slot.item.suggestedSell || '',
      slot.item.suggestedProfit || '',
      slot.item.netProfit || '',
      slot.item.spreadPercent || '',
      slot.item.volume || '',
      slot.item.buyLimit || '',
      slot.item.recommendedQty || '',
      slot.item.potentialProfit || '',
      slot.item.totalCost || '',
      slot.item.assignedAt || ''
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => formatCSVCell(cell)).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Parse CSV string to slots data
 * @param {string} csvString - CSV content
 * @returns {Array} Array of slot objects
 */
export const importSlotsFromCSV = (csvString) => {
  if (!csvString || csvString.trim() === '') {
    return [];
  }

  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header row - normalize headers (trim, lowercase for matching)
  const headers = parseCSVLine(lines[0]);
  const headerMap = {};
  const normalizedHeaderMap = {}; // For case-insensitive matching
  
  headers.forEach((header, index) => {
    const trimmed = header.trim();
    headerMap[trimmed] = index;
    normalizedHeaderMap[trimmed.toLowerCase()] = { original: trimmed, index };
  });

  // Helper to find header index (case-insensitive)
  const findHeaderIndex = (headerName) => {
    const normalized = headerName.toLowerCase();
    return normalizedHeaderMap[normalized]?.index;
  };

  const slots = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = parseCSVLine(lines[i]);
    
    // Helper to get value by header name (case-insensitive)
    const getValue = (headerName) => {
      const idx = findHeaderIndex(headerName);
      return idx !== undefined ? values[idx] : undefined;
    };
    
    const slotId = getValue('Slot ID') ? parseInt(getValue('Slot ID')) : null;
    const itemName = getValue('Item Name')?.trim();
    
    const slot = {
      id: slotId || i,
      type: getValue('Slot Type')?.trim() || 'liquid',
      label: getValue('Slot Label')?.trim() || '',
      item: null
    };

    // Only add item if item name is provided
    if (itemName) {
      slot.item = {
        id: getValue('Item ID') ? parseInt(getValue('Item ID')) : null,
        name: itemName,
        icon: null, // Icon not stored in CSV
        buyPrice: getValue('Buy Price') ? parseFloat(getValue('Buy Price')) : null,
        sellPrice: getValue('Sell Price') ? parseFloat(getValue('Sell Price')) : null,
        suggestedBuy: getValue('Suggested Buy') ? parseFloat(getValue('Suggested Buy')) : null,
        suggestedSell: getValue('Suggested Sell') ? parseFloat(getValue('Suggested Sell')) : null,
        suggestedProfit: getValue('Suggested Profit') ? parseFloat(getValue('Suggested Profit')) : null,
        netProfit: getValue('Net Profit') ? parseFloat(getValue('Net Profit')) : null,
        spreadPercent: getValue('Spread Percent') ? parseFloat(getValue('Spread Percent')) : null,
        volume: getValue('Volume') ? parseInt(getValue('Volume')) : null,
        buyLimit: getValue('Buy Limit') ? parseInt(getValue('Buy Limit')) : null,
        recommendedQty: getValue('Recommended Qty') ? parseInt(getValue('Recommended Qty')) : 1,
        potentialProfit: getValue('Potential Profit') ? parseFloat(getValue('Potential Profit')) : null,
        totalCost: getValue('Total Cost') ? parseFloat(getValue('Total Cost')) : null,
        assignedAt: getValue('Assigned At')?.trim() || new Date().toISOString()
      };
    }

    slots.push(slot);
  }

  return slots;
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Read CSV file from input
 * @param {File} file - File object from input
 * @returns {Promise<string>} CSV content as string
 */
export const readCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        resolve(e.target.result);
      } catch (error) {
        reject(new Error('Failed to read file: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Helper: Escape and format cell value for CSV
 * @param {any} value - Cell value
 * @returns {string} Formatted CSV cell
 */
const formatCSVCell = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Helper: Escape string for CSV
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeCSV = (str) => {
  if (!str) return '';
  return String(str).replace(/"/g, '""');
};

/**
 * Helper: Parse CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array<string>} Array of cell values
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of cell
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last cell
  result.push(current);
  
  return result;
};
