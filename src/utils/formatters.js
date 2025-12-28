export const formatNumber = (num) => {
  const n = Number(num);
  if (!Number.isFinite(n)) {
    return '0';
  }

  // Always display whole numbers (no decimal GP).
  const rounded = Math.round(n);
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? '-' : '';

  // Decimals are allowed in shorthand (K/M/B) for readability.
  if (abs >= 1000000000) return sign + (abs / 1000000000).toFixed(2) + 'B';
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(2) + 'M';
  if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + 'K';
  return sign + abs.toLocaleString();
};

export const formatGp = (num) => {
  return formatNumber(num) + ' gp';
};
