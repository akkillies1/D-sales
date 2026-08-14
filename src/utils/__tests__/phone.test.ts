import { describe, test, expect } from 'vitest';
import { normalizePhoneNumber } from '../phone';

describe('phone utilities', () => {
  test('normalize various Indian numbers', () => {
    expect(normalizePhoneNumber('9876543210')).toBe('+919876543210');
    expect(normalizePhoneNumber('09876543210')).toBe('+919876543210');
    expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210');
    expect(normalizePhoneNumber('919876543210')).toBe('+919876543210');
  });

  test('normalize international numbers with +', () => {
    expect(normalizePhoneNumber('+441234567890')).toBe('+441234567890');
  });
});
