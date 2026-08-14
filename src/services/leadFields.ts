export interface FieldDefinition {
  internalKey: string;
  displayName: string;
  aliases: string[];
  required?: boolean;
  dataType?: 'string' | 'number' | 'date' | 'phone' | 'email';
}

export const LEAD_FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    internalKey: 'slNo',
    displayName: 'Sl No',
    aliases: ['sl no', 'slno', 's.no', 'sno', 'id', 'serial', 'number'],
    required: false,
    dataType: 'string',
  },
  {
    internalKey: 'date',
    displayName: 'Date',
    aliases: ['date', 'created date', 'enquiry date', 'lead date', 'timestamp'],
    dataType: 'date',
  },
  {
    internalKey: 'name',
    displayName: 'Name',
    aliases: ['name', 'full name', 'customer name', 'client name', 'lead name'],
    required: true,
    dataType: 'string',
  },
  {
    internalKey: 'contact',
    displayName: 'Contact',
    aliases: ['phone', 'mobile', 'mobile number', 'phone number', 'contact', 'whatsapp', 'tel', 'contact number'],
    dataType: 'phone',
  },
  {
    internalKey: 'place',
    displayName: 'Place',
    aliases: ['place', 'location', 'city', 'area', 'site', 'address'],
    dataType: 'string',
  },
  {
    internalKey: 'requirement',
    displayName: 'Requirement',
    aliases: ['requirement', 'requirements', 'project requirement', 'service required', 'interested in', 'looking for', 'details'],
    dataType: 'string',
  },
  {
    internalKey: 'platform',
    displayName: 'Platform',
    aliases: ['platform', 'source', 'lead source', 'campaign', 'channel'],
    dataType: 'string',
  },
  {
    internalKey: 'reference',
    displayName: 'Reference',
    aliases: ['reference', 'ref', 'referred by'],
    dataType: 'string',
  },
  {
    internalKey: 'category',
    displayName: 'Category',
    aliases: ['category', 'type', 'work type', 'service type'],
    dataType: 'string',
  },
  {
    internalKey: 'followUpDate',
    displayName: 'Follow Up Date',
    aliases: ['follow up date', 'followup', 'next follow', 'next date', 'remind'],
    dataType: 'date',
  },
  {
    internalKey: 'status',
    displayName: 'Status',
    aliases: ['status', 'lead status', 'pipeline stage', 'stage'],
    dataType: 'string',
  },
  {
    internalKey: 'status2',
    displayName: 'Status 2',
    aliases: ['status2', 'notes', 'remarks', 'discussion', 'substatus'],
    dataType: 'string',
  },
  {
    internalKey: 'dealValue',
    displayName: 'Deal Value',
    aliases: ['deal value', 'budget', 'amount', 'price', 'estimate'],
    dataType: 'number',
  },
];

function normalizeText(s?: string): string {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

export function findBestFieldMatch(header: string): { key: string; confidence: number } | null {
  if (!header) return null;
  const raw = String(header).trim();
  const lowered = raw.toLowerCase();
  const norm = normalizeText(raw);

  // Exact alias match highest priority
  for (const def of LEAD_FIELD_DEFINITIONS) {
    for (const a of def.aliases) {
      if (normalizeText(a) === norm) return { key: def.internalKey, confidence: 0.99 };
    }
  }

  // Substring / token matches
  const tokens = lowered.split(/[^a-z0-9]+/).filter(Boolean);
  let best: { key: string; score: number } | null = null;
  for (const def of LEAD_FIELD_DEFINITIONS) {
    let score = 0;
    const aliasText = def.aliases.join(' ').toLowerCase();
    for (const t of tokens) {
      if (aliasText.includes(t)) score += 2;
      if (def.displayName.toLowerCase().includes(t)) score += 1;
    }
    // prefer shorter header names
    if (norm.length <= 4 && aliasText.includes(norm)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { key: def.internalKey, score };
  }

  if (best) {
    // normalize to 0..1 confidence
    const conf = Math.min(0.95, Math.max(0.25, Math.round((best.score / 6) * 100) / 100));
    return { key: best.key, confidence: conf };
  }

  return null;
}
