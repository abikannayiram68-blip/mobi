export const toINR = (price: number): string => {
  if (!price) return '₹0';
  const converted = Math.round(price * 83);
  return `₹${converted.toLocaleString('en-IN')}`;
};
