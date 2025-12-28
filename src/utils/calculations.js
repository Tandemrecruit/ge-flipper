// Tax calculation - 2% on sell price, capped at 5M
// Items with value under 50gp are exempt from tax
export const calculateTax = (sellPrice) => {
  if (sellPrice < 50) {
    return 0;
  }
  const tax = Math.floor(sellPrice * 0.02);
  return Math.min(tax, 5000000);
};

// Convert net price (after tax, as shown in GE history) to gross price (before tax)
// GE history shows: (gross - tax) = net, where tax = min(gross * 0.02, 5M)
// Items under 50gp have no tax, so net = gross
export const netToGross = (netPrice) => {
  // Items under 50gp are exempt from tax, so net = gross
  if (netPrice < 50) {
    return netPrice;
  }
  // If net >= 245M, the 5M cap was likely applied: gross = net + 5M
  // Otherwise: net = gross * 0.98, so gross = net / 0.98
  if (netPrice >= 245000000) {
    return netPrice + 5000000;
  }
  return Math.round(netPrice / 0.98);
};
