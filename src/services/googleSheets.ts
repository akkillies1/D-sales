import { Lead } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1CJT0fV1bSGtu_d8vC3zZsFGjIfIZDf5ch9KCM3Bftvs';

export const DEFAULT_HEADERS = [
  'Sl no',
  'Date',
  'Name',
  'Contact',
  'Place',
  'Requirement',
  'Platform',
  'Reference',
  'loose Furniture/Interior/ WI',
  'Follow Up Date',
  'Status',
  'Status 2',
];

export const INITIAL_DEMO_LEADS: Lead[] = [];

// Removed demo lead fixtures to make the app production-ready.
// Start with an empty dataset by default; demo/sample data can be populated via the Sheets UI when required.

/**
 * Normalize header text for fuzzy matching
 */
function normalizeHeader(h: string): string {
  return (h || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Match a header string to a standard Lead field key or custom
 */
export function matchHeaderToKey(
  header: string
): keyof Omit<Lead, 'rowIndex' | 'customFields' | 'history'> | 'custom' {
  const norm = normalizeHeader(header);
  if (!norm) return 'custom';

  // 1. Serial No / ID
  if (
    ['slno', 'sl', 'sno', 'serial', 'id', 'no', 'number', 'sl', 'sr', 'srno'].includes(norm) ||
    norm.startsWith('sl') ||
    norm.startsWith('sno')
  ) {
    return 'slNo';
  }

  // 2. Follow-up Date (check BEFORE general date)
  if (
    norm.includes('follow') ||
    norm.includes('nextdate') ||
    norm.includes('nextcontact') ||
    norm.includes('remind') ||
    norm.includes('duedate') ||
    norm.includes('nextfollow')
  ) {
    return 'followUpDate';
  }

  // 3. Date
  if (
    norm.includes('date') ||
    norm.includes('created') ||
    norm.includes('inquir') ||
    norm.includes('timestamp') ||
    norm.includes('entry') ||
    norm === 'dt'
  ) {
    return 'date';
  }

  // 4. Name / Client / Customer
  if (
    norm.includes('name') ||
    norm.includes('client') ||
    norm.includes('customer') ||
    norm.includes('prospect') ||
    norm.includes('person') ||
    norm.includes('lead')
  ) {
    if (
      !norm.includes('status') &&
      !norm.includes('stage') &&
      !norm.includes('source') &&
      !norm.includes('ref')
    ) {
      return 'name';
    }
  }

  // 5. Contact / Phone / Mobile / Email
  if (
    norm.includes('phone') ||
    norm.includes('mobile') ||
    norm.includes('contact') ||
    norm.includes('email') ||
    norm.includes('tel') ||
    norm.includes('whatsapp') ||
    norm.includes('call') ||
    norm.includes('number')
  ) {
    return 'contact';
  }

  // 6. Place / Location / City / Address
  if (
    norm.includes('place') ||
    norm.includes('location') ||
    norm.includes('city') ||
    norm.includes('address') ||
    norm.includes('area') ||
    norm.includes('site') ||
    norm.includes('town') ||
    norm.includes('state') ||
    norm.includes('district')
  ) {
    return 'place';
  }

  // 7. Status / Pipeline Stage
  if (
    norm.includes('stage') ||
    norm.includes('pipelin') ||
    norm === 'status' ||
    norm === 'leadstatus' ||
    norm === 'currentstatus' ||
    (norm.includes('status') &&
      !norm.includes('status2') &&
      !norm.includes('sub') &&
      !norm.includes('note') &&
      !norm.includes('remark') &&
      !norm.includes('discussion'))
  ) {
    return 'status';
  }

  // 8. Discussion Notes / Sub-status / Remarks / Outcome
  if (
    norm.includes('note') ||
    norm.includes('remark') ||
    norm.includes('comment') ||
    norm.includes('discussion') ||
    norm.includes('outcome') ||
    norm.includes('substatus') ||
    norm.includes('status2') ||
    norm.includes('update')
  ) {
    return 'status2';
  }

  // 9. Requirement / Details / Scope / Service
  if (
    norm.includes('require') ||
    norm.includes('detail') ||
    norm.includes('scope') ||
    norm.includes('desc') ||
    norm.includes('service') ||
    norm.includes('project') ||
    norm.includes('work') ||
    norm.includes('item')
  ) {
    return 'requirement';
  }

  // 10. Platform / Source / Channel
  if (
    norm.includes('source') ||
    norm.includes('platform') ||
    norm.includes('channel') ||
    norm.includes('medium') ||
    norm.includes('campaign') ||
    norm.includes('referrer')
  ) {
    return 'platform';
  }

  // 11. Reference / Referred By
  if (norm.includes('ref') || norm.includes('refer')) {
    return 'reference';
  }

  // 12. Category / Work Type
  if (
    norm.includes('cat') ||
    norm.includes('type') ||
    norm.includes('dept') ||
    norm.includes('interior') ||
    norm.includes('furniture')
  ) {
    return 'category';
  }

  // 13. Deal Value / Budget / Amount
  if (
    norm.includes('val') ||
    norm.includes('budget') ||
    norm.includes('amount') ||
    norm.includes('cost') ||
    norm.includes('price') ||
    norm.includes('estimate') ||
    norm.includes('revenue') ||
    norm.includes('deal') ||
    norm.includes('inr') ||
    norm.includes('rs')
  ) {
    return 'dealValue' as any;
  }

  return 'custom';
}

/**
 * Safely parse numerical deal values from strings like "₹1,50,000", "50k", "2.5 Lakhs"
 */
export function parseDealValue(valStr: string | number | undefined): number {
  if (typeof valStr === 'number') return isNaN(valStr) ? 0 : valStr;
  if (!valStr) return 0;
  const str = String(valStr).trim().toLowerCase();
  if (str.endsWith('k')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 1000;
  }
  if (str.includes('lakh') || str.endsWith('l')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 100000;
  }
  if (str.includes('crore') || str.endsWith('cr')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 10000000;
  }
  const clean = str.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert raw 2D array of values from Sheet into Lead[]
 */
export function convertRowsToLeads(
  rows: string[][],
  customMapping?: Record<string, string>
): {
  headers: string[];
  leads: Lead[];
} {
  if (!rows || rows.length === 0) {
    return { headers: DEFAULT_HEADERS, leads: [] };
  }

  // Find the actual header row by looking for common header keywords
  let headerRowIdx = 0;
  let maxScore = -1;
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r] || [];
    let score = 0;
    const str = row.join(' ').toLowerCase();
    if (str.includes('name') || str.includes('client')) score += 1;
    if (str.includes('status') || str.includes('stage')) score += 1;
    if (str.includes('date') || str.includes('time')) score += 1;
    if (str.includes('contact') || str.includes('phone')) score += 1;
    if (score > maxScore) {
      maxScore = score;
      headerRowIdx = r;
    }
  }
  // If no obvious headers found, fallback to row 0
  if (maxScore === 0) headerRowIdx = 0;

  const rawHeaders = (rows[headerRowIdx] || []).map((h) => (h || '').trim());
  const hasValidHeader = rawHeaders.some((h) => h.length > 0);
  const headers = hasValidHeader ? rawHeaders : DEFAULT_HEADERS;

  // Build field index mapping
  const fieldKeyMap: (keyof Omit<Lead, 'rowIndex' | 'customFields' | 'history'> | 'custom')[] = [];
  const matchedKeys = new Set<string>();

  headers.forEach((h, colIdx) => {
    let key: any = customMapping && customMapping[h] ? customMapping[h] : matchHeaderToKey(h);
    if (key !== 'custom' && !matchedKeys.has(key)) {
      fieldKeyMap[colIdx] = key;
      matchedKeys.add(key);
    } else {
      // Positional fallback if default headers are used or unmatched
      if (!hasValidHeader && colIdx < DEFAULT_HEADERS.length) {
        const defaultKeys: (keyof Omit<Lead, 'rowIndex' | 'customFields' | 'history'>)[] = [
          'slNo',
          'date',
          'name',
          'contact',
          'place',
          'requirement',
          'platform',
          'reference',
          'category',
          'followUpDate',
          'status',
          'status2',
        ];
        fieldKeyMap[colIdx] = defaultKeys[colIdx];
      } else {
        fieldKeyMap[colIdx] = 'custom';
      }
    }
  });

  const leads: Lead[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => !cell || cell.trim() === '')) {
      continue; // skip empty rows
    }

    let slNo = '';
    let date = '';
    let name = '';
    let contact = '';
    let place = '';
    let requirement = '';
    let platform = '';
    let reference = '';
    let category = '';
    let followUpDate = '';
    let status = '';
    let status2 = '';
    let dealValueRaw = '';
    const customFields: Record<string, string> = {};

    headers.forEach((headerName, colIdx) => {
      const val = (row[colIdx] || '').trim();
      const key = fieldKeyMap[colIdx];

      switch (key) {
        case 'slNo':
          slNo = val;
          break;
        case 'date':
          date = val;
          break;
        case 'name':
          name = val;
          break;
        case 'contact':
          contact = val;
          break;
        case 'place':
          place = val;
          break;
        case 'requirement':
          requirement = val;
          break;
        case 'platform':
          platform = val;
          break;
        case 'reference':
          reference = val;
          break;
        case 'category':
          category = val;
          break;
        case 'followUpDate':
          followUpDate = val;
          break;
        case 'status':
          status = val;
          break;
        case 'status2':
          status2 = val;
          break;
        case 'dealValue':
          dealValueRaw = val;
          break;
        default:
          if (headerName) {
            customFields[headerName] = val;
          }
          break;
      }
    });

    // Smart Fallbacks if primary fields were not caught by header mapping
    if (!name) {
      for (const [ckey, cval] of Object.entries(customFields)) {
        if (cval && /name|client|customer|prospect|person/i.test(ckey)) {
          name = cval;
          break;
        }
      }
      if (!name && row[2]) name = row[2];
      if (!name && row[1] && !/\d{2,}/.test(row[1])) name = row[1];
    }

    if (!contact) {
      for (const [ckey, cval] of Object.entries(customFields)) {
        if (cval && /phone|mobile|contact|email|tel/i.test(ckey)) {
          contact = cval;
          break;
        }
      }
      if (!contact) {
        const phoneCell = row.find((c) => c && (/\+?\d[\d\s-]{8,}/.test(c) || c.includes('@')));
        if (phoneCell) contact = phoneCell;
      }
    }

    if (!place) {
      for (const [ckey, cval] of Object.entries(customFields)) {
        if (cval && /place|location|city|address|area|site/i.test(ckey)) {
          place = cval;
          break;
        }
      }
    }

    if (!requirement) {
      for (const [ckey, cval] of Object.entries(customFields)) {
        if (cval && /require|detail|scope|desc|service|project/i.test(ckey)) {
          requirement = cval;
          break;
        }
      }
    }

    if (!followUpDate) {
      for (const [ckey, cval] of Object.entries(customFields)) {
        if (cval && /follow|next|remind/i.test(ckey)) {
          followUpDate = cval;
          break;
        }
      }
    }

    // Try parsing deal value from explicit column or requirement text
    let parsedVal = parseDealValue(dealValueRaw);
    if (!parsedVal && requirement) {
      parsedVal = parseDealValue(requirement);
    }

    leads.push({
      rowIndex: i + 1, // 1-indexed spreadsheet row
      slNo: slNo || String(i - headerRowIdx),
      date,
      name: name || `Lead #${i - headerRowIdx}`,
      contact,
      place,
      requirement,
      platform,
      reference,
      category: category || 'interior',
      followUpDate,
      status: status || 'New Inquiry',
      status2,
      dealValue: parsedVal || undefined,
      customFields,
    });
  }

  return { headers, leads };
}

/**
 * Convert a Lead back into an array of string values matching headers
 */
export function convertLeadToRow(lead: Lead, headers: string[]): string[] {
  const matchedKeys = new Set<string>();

  return headers.map((header, idx) => {
    const key = matchHeaderToKey(header);
    if (key !== 'custom' && !matchedKeys.has(key)) {
      matchedKeys.add(key);
      return String(lead[key] || '');
    }

    // Fallback positional indexing if headers match DEFAULT_HEADERS standard length
    if (headers.length === 12 && idx < 12) {
      const positionalVals = [
        lead.slNo,
        lead.date,
        lead.name,
        lead.contact,
        lead.place,
        lead.requirement,
        lead.platform,
        lead.reference,
        lead.category,
        lead.followUpDate,
        lead.status,
        lead.status2,
      ];
      return String(positionalVals[idx] || '');
    }

    return String(lead.customFields[header] || '');
  });
}

/**
 * Extract spreadsheet ID from full URL or raw ID
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Fetch spreadsheet metadata to get tab names
 */
export async function fetchSpreadsheetTabs(
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; sheets: string[] }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    cleanId
  )}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Permission Denied (403/401): Please sign in with a Google account that has access to this spreadsheet. If you recently added scopes, please sign out and sign back in.'
      );
    }
    if (res.status === 404) {
      throw new Error(
        'Spreadsheet not found (404): Please check your Spreadsheet ID or URL.'
      );
    }
    throw new Error(
      `Failed to fetch Google Sheet (${res.status}): ${errorText}`
    );
  }

  const data = await res.json();
  const title = data.properties?.title || 'Google Sheet';
  const sheets: string[] = (data.sheets || []).map(
    (s: any) => s.properties?.title || 'Sheet1'
  );

  return { title, sheets };
}

/**
 * Format range string with quoted sheet name so special characters and spaces work
 */
export function formatSheetRange(sheetName: string, range: string): string {
  const cleanName = sheetName.replace(/^'|'$/g, '');
  const needsQuotes = /[^a-zA-Z0-9_-]/.test(cleanName);
  const safeSheet = needsQuotes
    ? `'${cleanName.replace(/'/g, "''")}'`
    : cleanName;
  return `${safeSheet}!${range}`;
}

/**
 * Fetch all rows from a sheet tab
 */
export async function fetchSheetRows(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
  customMapping?: Record<string, string>
): Promise<{ headers: string[]; leads: Lead[] }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = formatSheetRange(sheetName, 'A1:ZZ1000');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    cleanId
  )}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Permission Denied (403/401): Please sign in with a Google account that has access to this spreadsheet. If you recently added scopes, please sign out and sign back in.'
      );
    }
    throw new Error(
      `Failed to fetch sheet values (${res.status}): ${errText}`
    );
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];
  return convertRowsToLeads(rows, customMapping);
}

/**
 * Robustly sync spreadsheet data automatically detecting tab
 */
export async function syncGoogleSheetData(
  spreadsheetIdInput: string,
  accessToken: string,
  selectedTabName?: string,
  customMapping?: Record<string, string>
): Promise<{
  title: string;
  sheetName: string;
  availableSheets: string[];
  headers: string[];
  leads: Lead[];
  spreadsheetId: string;
}> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdInput);
  const { title, sheets } = await fetchSpreadsheetTabs(spreadsheetId, accessToken);
  const sheetName =
    selectedTabName && sheets.includes(selectedTabName)
      ? selectedTabName
      : sheets[0] || 'Sheet1';
  const { headers, leads } = await fetchSheetRows(spreadsheetId, sheetName, accessToken, customMapping);
  return { title, sheetName, availableSheets: sheets, headers, leads, spreadsheetId };
}

/**
 * Helper to generate a 1-click Google Calendar Event creation link for lead follow-ups
 */
export function createGoogleCalendarUrl(lead: Lead): string {
  if (!lead.followUpDate) return '';
  const parts = lead.followUpDate.split(/[/.-]/);
  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  let day = new Date().getDate();

  if (parts.length === 3) {
    if (parts[2].length === 4) {
      day = parseInt(parts[0], 10) || day;
      month = parseInt(parts[1], 10) || month;
      year = parseInt(parts[2], 10) || year;
    } else if (parts[0].length === 4) {
      year = parseInt(parts[0], 10) || year;
      month = parseInt(parts[1], 10) || month;
      day = parseInt(parts[2], 10) || day;
    }
  }

  const startDateStr = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}T100000Z`;
  const endDateStr = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}T103000Z`;

  const title = encodeURIComponent(`Follow-Up with ${lead.name} (${lead.status})`);
  const details = encodeURIComponent(
    `SalesFlow Lead Follow-Up\n\nClient: ${lead.name}\nContact: ${lead.contact}\nRequirement: ${lead.requirement}\nLocation: ${lead.place}\nNotes: ${lead.status2}`
  );
  const location = encodeURIComponent(lead.place || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}`;
}

/**
 * Automatically sync from an existing spreadsheet OR search Drive for "SalesFlow Pro Leads"
 * OR automatically create a new sheet in the user's Drive if it doesn't exist yet.
 * This guarantees 100% reliable 2-way sync without 400/404 errors.
 */
export async function syncOrCreateGoogleSheet(
  spreadsheetIdInput: string,
  accessToken: string,
  selectedTabName?: string
): Promise<{
  title: string;
  sheetName: string;
  availableSheets: string[];
  headers: string[];
  leads: Lead[];
  spreadsheetId: string;
}> {
  const cleanId = extractSpreadsheetId(spreadsheetIdInput);

  // 1. If it's a real ID and not the placeholder default ID, try to sync it directly
  if (cleanId && cleanId !== DEFAULT_SPREADSHEET_ID) {
    try {
      return await syncGoogleSheetData(cleanId, accessToken, selectedTabName);
    } catch (err: any) {
      if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
        throw err;
      }
      // If 404/400, fall through to Drive search / creation
    }
  }

  // 2. Search user's Google Drive for existing "SalesFlow Pro Leads" spreadsheet (best-effort)
  try {
    const driveSearchUrl =
      "https://www.googleapis.com/drive/v3/files?q=name='SalesFlow Pro Leads' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&orderBy=modifiedTime desc&pageSize=10";
    const searchRes = await fetch(driveSearchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const foundId = searchData.files[0].id;
        try {
          return await syncGoogleSheetData(foundId, accessToken, selectedTabName);
        } catch (e) {
          // ignore and fall through
        }
      }
    }
  } catch (driveErr) {
    // ignore and fall through
  }

  // If we reach here, no suitable spreadsheet was found. Do NOT automatically create one
  // to avoid accidental overwrites. Let the UI prompt the user to create or select a sheet.
  throw new Error('No existing spreadsheet found in Drive and no valid spreadsheet ID provided. Use "Create New Sheet" or paste/select an existing spreadsheet.');
}

/**
 * List spreadsheets in the user's Drive (basic list for "Browse" UI)
 */
export async function listDriveSpreadsheets(
  accessToken: string,
  pageSize = 50,
  query = ''
): Promise<Array<{ id: string; name: string }>> {
  const q = `${query ? `name contains '${query}' and ` : ''}mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const encodedQ = encodeURIComponent(q);
  const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodedQ}&pageSize=${pageSize}&fields=files(id,name)`;

  const res = await fetch(driveUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    // Provide a clearer message for unauthorized / insufficient scope
    if (res.status === 403 || res.status === 401) {
      let msg = `Drive API access denied (${res.status}).`;
      try {
        const err = JSON.parse(text);
        if (err && err.error && err.error.message) msg += ` ${err.error.message}`;
      } catch (e) {
        // ignore JSON parse
      }
      throw new Error(msg + ' Ensure the token includes Drive scopes and the OAuth consent allows these scopes. IMPORTANT: If you recently added scopes in Google Cloud Console, you MUST sign out and sign back in for them to take effect.');
    }
    throw new Error(`Failed to list Drive files (${res.status}): ${text}`);
  }

  const data = await res.json();
  const files = (data.files || []).map((f: any) => ({ id: f.id, name: f.name }));
  return files;
}

/**
 * Create a new sample Google Sheet in user's Drive with headers and demo leads
 */
export async function createSampleSpreadsheet(
  accessToken: string,
  title = 'SalesFlow Pro Leads'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string; sheetName: string }> {
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet (${createRes.status}): ${errText}`);
  }

  const createData = await createRes.json();
  const spreadsheetId = createData.spreadsheetId;
  const spreadsheetUrl =
    createData.spreadsheetUrl ||
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const sheetName = createData.sheets?.[0]?.properties?.title || 'Sheet1';

  const rowsToInsert: string[][] = [
    DEFAULT_HEADERS,
    ...INITIAL_DEMO_LEADS.map((lead) => convertLeadToRow(lead, DEFAULT_HEADERS)),
  ];

  const range = formatSheetRange(sheetName, `A1:Z${rowsToInsert.length}`);
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const updateRes = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rowsToInsert,
    }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to populate sample data (${updateRes.status}): ${errText}`);
  }

  return { spreadsheetId, spreadsheetUrl, title, sheetName };
}

/**
 * Append a new lead row to the sheet
 */
export async function appendRowToSheet(
  spreadsheetId: string,
  sheetName: string,
  lead: Lead,
  headers: string[],
  accessToken: string
): Promise<{ updatedRowIndex?: number }> {
  const rowValues = convertLeadToRow(lead, headers);
  const maxColLetter = getColumnLetter(Math.max(headers.length - 1, 25));
  const range = formatSheetRange(sheetName, `A:${maxColLetter}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append row (${res.status}): ${errText}`);
  }

  const data = await res.json();
  let updatedRowIndex: number | undefined;
  const updatedRange = data.updates?.updatedRange;
  if (updatedRange) {
    const match = updatedRange.match(/!A(\d+):/i) || updatedRange.match(/!([A-Z]+)(\d+):/i);
    if (match) {
      const rowNum = parseInt(match[match.length - 1], 10);
      if (!isNaN(rowNum)) {
        updatedRowIndex = rowNum;
      }
    }
  }

  return { updatedRowIndex };
}

/**
 * Update an existing lead row in the sheet
 */
export async function updateRowInSheet(
  spreadsheetId: string,
  sheetName: string,
  lead: Lead,
  headers: string[],
  accessToken: string
): Promise<void> {
  const rowValues = convertLeadToRow(lead, headers);
  const maxColLetter = getColumnLetter(Math.max(headers.length - 1, 25));
  const range = formatSheetRange(
    sheetName,
    `A${lead.rowIndex}:${maxColLetter}${lead.rowIndex}`
  );
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update row (${res.status}): ${errText}`);
  }
}

/**
 * Clear a lead row in the Google Sheet upon deletion
 */
export async function clearRowInSheet(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  headers: string[],
  accessToken: string
): Promise<void> {
  const emptyRow = new Array(Math.max(headers.length, 12)).fill('');
  const maxColLetter = getColumnLetter(Math.max(headers.length - 1, 25));
  const range = formatSheetRange(
    sheetName,
    `A${rowIndex}:${maxColLetter}${rowIndex}`
  );
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}:clear`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to clear row (${res.status}): ${errText}`);
  }
}

/**
 * Add a new column heading to Row 1 of the Google Sheet
 */
export async function appendHeaderColumn(
  spreadsheetId: string,
  sheetName: string,
  newHeaderName: string,
  currentHeaderCount: number,
  accessToken: string
): Promise<void> {
  const targetColumnLetter = getColumnLetter(currentHeaderCount);
  const range = formatSheetRange(sheetName, `${targetColumnLetter}1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[newHeaderName]],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to add header column (${res.status}): ${errText}`);
  }
}

/**
 * Helper: Convert 0-indexed column integer to Excel/Google Sheets letter (e.g. 0 -> A, 1 -> B, 26 -> AA)
 */
export function getColumnLetter(colIdx: number): string {
  let temp = colIdx;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}
