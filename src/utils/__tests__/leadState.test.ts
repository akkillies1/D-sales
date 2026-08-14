import { describe, expect, test } from 'vitest';
import { getConnectedSpreadsheetLeads } from '../leadState';

describe('lead state after spreadsheet sync', () => {
  test('keeps the synced leads instead of clearing them', () => {
    const currentLeads = [{ rowIndex: 1, slNo: '1', date: '2024-01-01', name: 'Alice', contact: '9999999999', place: 'Bengaluru', requirement: 'Kitchen', platform: '', reference: '', category: 'interior', followUpDate: '', status: 'New Inquiry', status2: '', customFields: {} }];

    const nextLeads = getConnectedSpreadsheetLeads(currentLeads, currentLeads);

    expect(nextLeads).toHaveLength(1);
    expect(nextLeads[0].name).toBe('Alice');
  });

  test('only clears leads when the reset flag is explicitly requested', () => {
    const currentLeads = [{ rowIndex: 1, slNo: '1', date: '2024-01-01', name: 'Bob', contact: '9999999999', place: 'Coimbatore', requirement: 'Wardrobe', platform: '', reference: '', category: 'interior', followUpDate: '', status: 'New Inquiry', status2: '', customFields: {} }];

    const nextLeads = getConnectedSpreadsheetLeads(currentLeads, undefined, true);

    expect(nextLeads).toEqual([]);
  });
});
