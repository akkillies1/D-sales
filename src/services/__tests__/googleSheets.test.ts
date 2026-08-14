import { describe, test, expect } from 'vitest';
import { detectHeaderRow, buildHeaderMapping, convertRowsToLeads } from '../googleSheets';

describe('googleSheets header detection and mapping', () => {
  test('detectHeaderRow finds header in second row', () => {
    const rows = [
      ['Some metadata', 'ignore'],
      ['Name', 'Phone', 'Date'],
      ['Alice', '9876543210', '01/02/2024'],
    ];
    const res = detectHeaderRow(rows, 5);
    expect(res.headerRowIdx).toBe(1);
    expect(res.confidence).toBeGreaterThan(0);
  });

  test('buildHeaderMapping suggests mappings for known headers', () => {
    const headers = ['Name', 'Phone', 'Some Unknown'];
    const mapping = buildHeaderMapping(headers);
    expect(mapping['Name'].suggestedKey).toContain('name');
    expect(mapping['Phone'].suggestedKey).toContain('contact');
    expect(mapping['Some Unknown'].confidence).toBeGreaterThanOrEqual(0);
  });

  test('convertRowsToLeads respects header override and returns leads', () => {
    const rows = [
      ['Meta'],
      ['Name', 'Phone', 'Date'],
      ['Bob', '09876543210', '2024-02-01'],
    ];
    const { headers, leads } = convertRowsToLeads(rows, undefined, 1);
    expect(headers[0]).toBe('Name');
    expect(leads.length).toBe(1);
    expect(leads[0].name).toMatch(/Bob/);
  });
});
