import type { Lead } from '../types';

export function getConnectedSpreadsheetLeads(
  currentLeads: Lead[] = [],
  nextLeads?: Lead[] | null,
  reset = false
): Lead[] {
  if (reset) {
    return [];
  }

  if (Array.isArray(nextLeads)) {
    return nextLeads;
  }

  return currentLeads;
}
