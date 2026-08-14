import { describe, expect, test } from 'vitest';
import { shouldUseMobileLeadLayout } from '../../utils/leadLayout';

describe('LeadTable mobile layout detection', () => {
  test('uses compact lead cards on narrow screens', () => {
    expect(shouldUseMobileLeadLayout(500)).toBe(true);
    expect(shouldUseMobileLeadLayout(768)).toBe(false);
    expect(shouldUseMobileLeadLayout(1200)).toBe(false);
  });
});
