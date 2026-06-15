export function formatMiles(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseMiles(value: string): number {
  return parseFloat(value.replace(/\./g, '')) || 0;
}
