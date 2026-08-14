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

// New helpers for normalization and building communication URLs
export function normalizePhoneNumber(raw?: string | null): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Preserve leading + if present, otherwise strip non-numeric
  const hasPlus = s.startsWith('+');
  const stripped = s.replace(/[^0-9+]/g, '');

  // If only a plus sign or empty after stripping, invalid
  const onlyPlus = stripped === '+' || stripped.length === 0;
  if (onlyPlus) return null;

  // If starts with +, keep + and digits
  if (hasPlus) {
    const digits = stripped.replace(/[^0-9]/g, '');
    if (digits.length < 7) return null;
    return `+${digits}`;
  }

  // No leading +: remove non-digits and analyze
  const digits = stripped.replace(/[^0-9]/g, '');
  if (!digits) return null;

  // If already starts with country code 91 and length 12 (e.g., 919876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // If digits length 10 and looks like Indian mobile (starts with 6-9)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }

  // If digits length 11 and starts with 0 (e.g., 09876543210), strip leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    const d = digits.slice(1);
    if (d.length === 10 && /^[6-9]/.test(d)) return `+91${d}`;
  }

  // If digits length between 8 and 15, assume international without + and return with +
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export function buildWhatsAppUrl(rawPhone: string | null | undefined, leadName?: string): string | null {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized) return null;
  // wa.me expects international number without +
  const withoutPlus = normalized.replace(/^[+]/, '');
  const defaultMsg = `Hi ${leadName || ''}, this is Dcode Interiors. We received your enquiry and would be happy to help you with your interior requirements. Please let us know a convenient time to discuss your project.`;
  const encoded = encodeURIComponent(defaultMsg);
  return `https://wa.me/${withoutPlus}?text=${encoded}`;
}

export function buildCallUrl(rawPhone: string | null | undefined): string | null {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized) return null;
  return `tel:${normalized}`;
}
