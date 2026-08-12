import React, { useState } from 'react';
import { X, Check, RefreshCw, LayoutGrid, HelpCircle } from 'lucide-react';
import { Lead } from '../types';
import { matchHeaderToKey } from '../services/googleSheets';

interface ColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers?: string[];
  sheetHeaders?: string[];
  currentMapping?: Record<string, string>;
  onSaveMapping: (mapping: Record<string, keyof Omit<Lead, 'rowIndex' | 'customFields' | 'history'>>) => void;
}

const FIELD_OPTIONS: Array<{ key: keyof Omit<Lead, 'rowIndex' | 'customFields' | 'history'> | 'custom'; label: string; desc: string }> = [
  { key: 'name', label: 'Client / Lead Name', desc: 'Main contact or business name' },
  { key: 'contact', label: 'Phone / Contact Info', desc: 'Phone number or email address' },
  { key: 'status', label: 'Pipeline Stage / Status', desc: 'Lead status (e.g., New, Contacted, Won)' },
  { key: 'followUpDate', label: 'Follow-Up Date', desc: 'Scheduled next follow up date' },
  { key: 'dealValue', label: 'Deal Amount / Budget', desc: 'Monetary value (numeric or currency string)' },
  { key: 'slNo', label: 'Sl No / ID', desc: 'Unique identifier or serial number' },
  { key: 'date', label: 'Created / Inquiry Date', desc: 'Date lead entered the funnel' },
  { key: 'place', label: 'Location / City', desc: 'Address, city, or geographical zone' },
  { key: 'requirement', label: 'Requirement / Scope', desc: 'Description of requested service or project' },
  { key: 'platform', label: 'Lead Source / Platform', desc: 'Meta Ads, Google, Website, Walk-in, etc.' },
  { key: 'reference', label: 'Referred By / Reference', desc: 'Reference person or agency' },
  { key: 'category', label: 'Category / Service Type', desc: 'Interior, Furniture, Contracting, etc.' },
  { key: 'status2', label: 'Discussion Notes / Sub-status', desc: 'Call notes, secondary status, or remarks' },
  { key: 'custom', label: 'Custom Attribute (Default)', desc: 'Kept as custom column field in CRM' },
];

export const ColumnMapperModal: React.FC<ColumnMapperModalProps> = ({
  isOpen,
  onClose,
  headers,
  sheetHeaders,
  currentMapping = {},
  onSaveMapping,
}) => {
  const activeHeaders = headers || sheetHeaders || [];

  const [mapping, setMapping] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    (activeHeaders || []).forEach((h) => {
      if (h) {
        initial[h] = currentMapping[h] || matchHeaderToKey(h);
      }
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleFieldChange = (header: string, selectedKey: string) => {
    setMapping((prev) => ({
      ...prev,
      [header]: selectedKey,
    }));
  };

  const handleResetAuto = () => {
    const auto: Record<string, any> = {};
    (activeHeaders || []).forEach((h) => {
      if (h) {
        auto[h] = matchHeaderToKey(h);
      }
    });
    setMapping(auto);
  };

  const handleSave = () => {
    onSaveMapping(mapping);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Sheet Column Mapper</h3>
              <p className="text-xs text-zinc-400">
                Match your Google Sheet column headers to CRM lead fields
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start space-x-3 text-xs text-blue-300">
            <HelpCircle size={16} className="mt-0.5 shrink-0 text-blue-400" />
            <span>
              The app automatically detects column headers based on common names, but you can manually override any column mapping below. Unmapped columns will be preserved as custom fields.
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {(activeHeaders || []).map((header) => {
              const currentVal = mapping[header] || 'custom';
              return (
                <div
                  key={header}
                  className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block">
                      Sheet Header Column
                    </span>
                    <span className="text-sm font-semibold text-zinc-100 truncate block">
                      "{header}"
                    </span>
                  </div>

                  <div className="w-full sm:w-64">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">
                      Map to CRM Field
                    </label>
                    <select
                      value={currentVal}
                      onChange={(e) => handleFieldChange(header, e.target.value)}
                      className="w-full bg-black/80 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      {FIELD_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key} className="bg-zinc-900 text-zinc-200">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
          <button
            onClick={handleResetAuto}
            className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Reset to Auto Detect</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              <Check size={14} />
              <span>Apply Mappings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
