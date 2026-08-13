export function formatPhone(raw: string): string {
  if (!raw) return '';
  // Normalize and format for readability: +91 98765 43210 or simple grouping
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 12) {
	return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 11) {
	return `+${digits.slice(0, 1)} ${digits.slice(1, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 10) {
	return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return raw;
}
