import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { DEFAULT_HEADERS, createGoogleCalendarUrl, parseDealValue } from '../services/googleSheets';
import {
  X,
  Save,
  Calendar,
  Phone,
  MapPin,
  Tag,
  User,
  Briefcase,
  Globe,
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ExternalLink,
  Sparkles,
  Clock,
} from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  initialLead: Lead | null;
  headers: string[];
  nextSlNo: string;
  onOpenAddFieldModal?: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLead,
  headers,
  nextSlNo,
  onOpenAddFieldModal,
}) => {
  const [slNo, setSlNo] = useState('');
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [place, setPlace] = useState('');
  const [requirement, setRequirement] = useState('');
  const [platform, setPlatform] = useState('Reference');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState('interior');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState('New Inquiry');
  const [status2, setStatus2] = useState('');
  const [dealValue, setDealValue] = useState<string>('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const QUICK_CHIPS = [
    '📞 Call Unanswered',
    '📄 Proposal Sent',
    '🤝 Meeting / Site Visit Scheduled',
    '💬 WhatsApp Followed Up',
    '💰 Pricing Negotiated',
    '✅ Awaiting Final Advance',
  ];

  const [newDiscussionDate, setNewDiscussionDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  });
  const [newDiscussionNote, setNewDiscussionNote] = useState('');
  const [showRawStatus2, setShowRawStatus2] = useState(false);

  const parseDiscussionUpdates = (raw: string): string[] => {
    if (!raw || !raw.trim()) return [];
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const handleAddDiscussionUpdate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newDiscussionNote.trim()) return;
    const formattedUpdate = `[${newDiscussionDate.trim()}] ${newDiscussionNote.trim()}`;
    const nextStatus2 = status2.trim()
      ? `${status2.trim()}, ${formattedUpdate}`
      : formattedUpdate;
    setStatus2(nextStatus2);
    setNewDiscussionNote('');
  };

  const handleRemoveDiscussionUpdate = (indexToRemove: number) => {
    const updates = parseDiscussionUpdates(status2);
    const nextUpdates = updates.filter((_, idx) => idx !== indexToRemove);
    setStatus2(nextUpdates.join(', '));
  };

  const customHeaders = headers.filter(
    (h) => !DEFAULT_HEADERS.some((dh) => dh.toLowerCase() === h.trim().toLowerCase())
  );

  useEffect(() => {
    if (initialLead) {
      setSlNo(initialLead.slNo || nextSlNo);
      setDate(initialLead.date || '');
      setName(initialLead.name || '');
      setContact(initialLead.contact || '');
      setPlace(initialLead.place || '');
      setRequirement(initialLead.requirement || '');
      setPlatform(initialLead.platform || 'Reference');
      setReference(initialLead.reference || '');
      setCategory(initialLead.category || 'interior');
      setFollowUpDate(initialLead.followUpDate || '');
      setStatus(initialLead.status || 'New Inquiry');
      setStatus2(initialLead.status2 || '');
      setDealValue(initialLead.dealValue ? String(initialLead.dealValue) : '');
      setCustomFields(initialLead.customFields || {});
    } else {
      const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
      setSlNo(nextSlNo);
      setDate(todayStr);
      setName('');
      setContact('');
      setPlace('');
      setRequirement('Premium Interior Package');
      setPlatform('Reference');
      setReference('Self');
      setCategory('interior');
      setFollowUpDate(todayStr);
      setStatus('New Inquiry');
      setStatus2('under designing');
      setDealValue('');
      setCustomFields({});
    }
  }, [initialLead, isOpen, nextSlNo]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedVal = dealValue ? parseDealValue(dealValue) : undefined;
    const historyList = initialLead?.history ? [...initialLead.history] : [];

    if (initialLead && (initialLead.status !== status || initialLead.followUpDate !== followUpDate)) {
      historyList.push({
        timestamp: new Date().toLocaleString(),
        action: `Updated stage to "${status}" (Follow up: ${followUpDate})`,
      });
    } else if (!initialLead) {
      historyList.push({
        timestamp: new Date().toLocaleString(),
        action: `Created lead in stage "${status}"`,
      });
    }

    const leadToSave: Lead = {
      rowIndex: initialLead ? initialLead.rowIndex : -1, // will be assigned if -1
      slNo: slNo || nextSlNo,
      date: date || new Date().toLocaleDateString('en-GB'),
      name: name.trim(),
      contact: contact.trim(),
      place: place.trim(),
      requirement: requirement.trim(),
      platform: platform.trim(),
      reference: reference.trim(),
      category: category.trim(),
      followUpDate: followUpDate.trim(),
      status: status.trim(),
      status2: status2.trim(),
      dealValue: parsedVal,
      history: historyList,
      customFields,
    };

    onSave(leadToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="premium-modal rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">
              {initialLead ? 'Edit Lead' : 'Create New Lead'}
            </h3>
            <p className="text-xs text-zinc-500">
              {initialLead
                ? `Editing Row #${initialLead.rowIndex} (${initialLead.name})`
                : 'Add a new customer inquiry to Google Sheets'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-sm"
        >
          {/* Row 1: Sl No, Date, Follow Up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Sl No
              </label>
              <input
                type="text"
                value={slNo}
                onChange={(e) => setSlNo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Inquiry Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="01/12/2025"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Follow Up Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="04/12/2025"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Customer Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Deepa Teacher"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Contact Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="+91 98470 12345"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Place & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Place / Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Tripunitura, Kakkanad, etc."
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Category (Interior / Loose / WI)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  <option value="interior">interior</option>
                  <option value="loose Furniture">loose Furniture</option>
                  <option value="WI">WI / Modular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requirement */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Requirement / Package
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <textarea
                rows={2}
                placeholder="Premium Interior Package, Grand Interior, etc."
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Row 4: Platform, Reference & Deal Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Platform
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Reference, Instagram, Website..."
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Reference
              </label>
              <input
                type="text"
                placeholder="Soumya, Self, Nitheesh..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Estimated Deal Amount
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  type="text"
                  placeholder="e.g. ₹1,50,000 or 50k"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-emerald-300 font-mono font-medium focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Main Stage Status & Follow Up Date with Calendar Trigger */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Status 1 (Main Stage)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600 font-medium text-xs"
              >
                <option value="New Inquiry">New Inquiry</option>
                <option value="Estimate submitted">Estimate submitted</option>
                <option value="waiting for the design confirmation">
                  waiting for the design confirmation
                </option>
                <option value="Work awarded">Work awarded</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Follow-Up Date
                </label>
                {followUpDate && (
                  <a
                    href={createGoogleCalendarUrl({
                      rowIndex: 0,
                      slNo,
                      date,
                      name,
                      contact,
                      place,
                      requirement,
                      platform,
                      reference,
                      category,
                      followUpDate,
                      status,
                      status2,
                      customFields: {},
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Add to Google Calendar</span>
                    <ExternalLink className="w-2.5 h-2.5 ml-1" />
                  </a>
                )}
              </div>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Status 2: Discussion Updates Timeline (Comma-Separated in Sheet Cell) */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center">
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  <span>Status 2 / Discussion Updates Timeline</span>
                </label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Saved into a single Google Sheet cell separated by commas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRawStatus2(!showRawStatus2)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center bg-black/30 px-2 py-1 rounded border border-zinc-800"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                <span>{showRawStatus2 ? 'Hide Raw CSV' : 'Edit Raw CSV'}</span>
              </button>
            </div>

            {/* List existing updates */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {parseDiscussionUpdates(status2).length === 0 ? (
                <div className="text-xs text-zinc-500 italic py-2 text-center bg-black/20 rounded-lg border border-zinc-800/50">
                  No discussion updates yet. Add your first update below.
                </div>
              ) : (
                parseDiscussionUpdates(status2).map((updateStr, idx) => {
                  // highlight date tag if present
                  const dateMatch = updateStr.match(/^\[(.*?)\]\s*(.*)$/);
                  const datePart = dateMatch ? dateMatch[1] : null;
                  const textPart = dateMatch ? dateMatch[2] : updateStr;

                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs group hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start space-x-2 pr-2">
                        {datePart ? (
                          <span className="bg-blue-500/10 text-blue-400 font-mono text-[11px] px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0 font-medium">
                            {datePart}
                          </span>
                        ) : (
                          <span className="bg-zinc-800 text-zinc-400 font-mono text-[11px] px-1.5 py-0.5 rounded shrink-0">
                            Note
                          </span>
                        )}
                        <span className="text-zinc-200 break-words font-medium leading-relaxed">
                          {textPart}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscussionUpdate(idx)}
                        className="text-zinc-500 hover:text-red-400 opacity-60 group-hover:opacity-100 p-1 transition-opacity"
                        title="Remove this update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add new update bar */}
            <div className="pt-2 border-t border-zinc-800/60">
              <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">
                Add New Discussion Update
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Date (e.g. 31 Jul)"
                  value={newDiscussionDate}
                  onChange={(e) => setNewDiscussionDate(e.target.value)}
                  className="sm:w-28 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <input
                  type="text"
                  placeholder="Discussion details, next step..."
                  value={newDiscussionNote}
                  onChange={(e) => setNewDiscussionNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDiscussionUpdate(e as any);
                    }
                  }}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddDiscussionUpdate}
                  disabled={!newDiscussionNote.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add</span>
                </button>
              </div>

              {/* Quick Response Chips */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5 flex items-center">
                  <Sparkles className="w-3 h-3 text-amber-400 mr-1" />
                  <span>Quick Templates</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHIPS.map((chipText) => (
                    <button
                      key={chipText}
                      type="button"
                      onClick={() => setNewDiscussionNote(chipText)}
                      className="text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white px-2.5 py-1 rounded-full transition-colors font-medium"
                    >
                      {chipText}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Raw CSV Edit view */}
            {showRawStatus2 && (
              <div className="pt-2 border-t border-zinc-800/60 space-y-1">
                <label className="block text-[11px] font-mono text-zinc-400">
                  Raw Google Sheet Cell Content (Comma-Separated):
                </label>
                <input
                  type="text"
                  value={status2}
                  onChange={(e) => setStatus2(e.target.value)}
                  placeholder="Update 1, Update 2..."
                  className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Dynamic Custom Columns Section */}
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Custom Fields ({customHeaders.length} Columns)
              </div>
              {onOpenAddFieldModal && (
                <button
                  type="button"
                  onClick={onOpenAddFieldModal}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-blue-300 border border-zinc-700/80 px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Column Header</span>
                </button>
              )}
            </div>

            {customHeaders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customHeaders.map((colName) => (
                  <div key={colName}>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      {colName}
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter value for ${colName}...`}
                      value={customFields[colName] || ''}
                      onChange={(e) =>
                        setCustomFields((prev) => ({
                          ...prev,
                          [colName]: e.target.value,
                        }))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic bg-black/20 p-2.5 rounded-lg border border-zinc-800/50 flex items-center justify-between">
                <span>No custom columns added yet. Click "+ Add New Column Header" to add custom fields to your Google Sheet.</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-zinc-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 inline-block mr-1.5" />
              <span>{initialLead ? 'Save Changes' : 'Add to Google Sheet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
