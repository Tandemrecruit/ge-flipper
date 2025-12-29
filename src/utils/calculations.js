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
// GE history shows: (gross - tax) = net, where tax = min(floor(gross * 0.02), 5M)
// Items with gross < 50gp have no tax, so net = gross
export const netToGross = (netPrice) => {
  // Items that definitely have gross < 50 are exempt (net 0-48 means gross 0-48)
  // Edge case: net 49 could be from gross 49 (exempt) or gross 50 (taxed: 50 - 1 = 49)
  if (netPrice < 49) {
    return netPrice;
  }

  // Handle 5M cap case (net >= 245M means cap was applied)
  if (netPrice >= 245000000) {
    return netPrice + 5000000;
  }

  // Standard case: net = gross - floor(gross * 0.02)
  // Estimate gross and verify with actual tax calculation
  const estimatedGross = Math.round(netPrice / 0.98);

  // Verify the calculation matches
  const verifyTax = calculateTax(estimatedGross);
  if (estimatedGross - verifyTax === netPrice) {
    return estimatedGross;
  }

  // Handle rounding edge cases by trying nearby values
  for (const offset of [1, -1, 2, -2]) {
    const tryGross = estimatedGross + offset;
    const tryTax = calculateTax(tryGross);
    if (tryGross - tryTax === netPrice) {
      return tryGross;
    }
  }

  // Fallback to estimate
  return estimatedGross;
};
