export interface LeadHistoryItem {
  timestamp: string;
  action: string;
  user?: string;
  detail?: string;
}

export interface Lead {
  rowIndex: number; // Row number in Google Sheet (1-indexed, header is row 1, data starts row 2)
  slNo: string;
  date: string;
  name: string;
  contact: string;
  place: string;
  requirement: string;
  platform: string;
  reference: string;
  category: string; // "loose Furniture/Interior/ WI"
  followUpDate: string;
  status: string;
  status2: string;
  dealValue?: number; // Estimated or actual monetary value
  history?: LeadHistoryItem[];
  customFields: Record<string, string>; // Maps any dynamic header name to its cell value
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheetName: string;
  availableSheets?: string[];
  headers: string[]; // All column headers from Row 1
  lastSynced: Date | null;
  isDemoMode: boolean;
  autoSyncInterval?: number; // 0 = off, 30 = 30s, 60 = 60s
  customColumnMapping?: Record<string, keyof Omit<Lead, 'rowIndex' | 'customFields' | 'history'>>;
}

export type ActiveTab = 'dashboard' | 'table' | 'kanban' | 'followups';

export interface FilterState {
  search: string;
  status: string;
  category: string;
  place: string;
  followUpFilter: 'all' | 'today' | 'overdue' | 'upcoming';
}

export interface SalesMetrics {
  totalLeads: number;
  workAwarded: number;
  completed: number;
  inPipeline: number;
  lost: number;
  conversionRate: number;
  todayFollowUpsCount: number;
  overdueFollowUpsCount: number;
  totalPipelineValue: number;
  wonPipelineValue: number;
}

export interface FunnelStageData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
  value?: number;
}

