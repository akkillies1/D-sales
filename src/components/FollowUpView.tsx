import React, { useState } from 'react';
import { Lead } from '../types';
import {
  CalendarClock,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Calendar,
} from 'lucide-react';

interface FollowUpViewProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onUpdateFollowUp: (lead: Lead, nextDate: string) => void;
}

export const FollowUpView: React.FC<FollowUpViewProps> = ({
  leads,
  onEditLead,
  onUpdateFollowUp,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>(
    'all'
  );
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const isCompletedOrClosed = (l: Lead) => {
    const s1 = (l.status || '').toLowerCase();
    const s2 = (l.status2 || '').toLowerCase();
    return (
      s1.includes('award') ||
      s1.includes('complet') ||
      s1.includes('finish') ||
      s1.includes('closed') ||
      s1.includes('lost') ||
      s2.includes('complet') ||
      s2.includes('finish') ||
      s2.includes('closed') ||
      s2.includes('lost')
    );
  };

  const completedCount = leads.filter(isCompletedOrClosed).length;

  const activeLeads = leads.filter((l) => {
    if (showCompleted) return true;
    return !isCompletedOrClosed(l);
  });

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.includes('/')) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  const getLeadTiming = (
    dateStr: string
  ): 'today' | 'overdue' | 'upcoming' | 'none' => {
    const d = parseDate(dateStr);
    if (!d) return 'none';
    if (d >= todayStart && d <= todayEnd) return 'today';
    if (d < todayStart) return 'overdue';
    return 'upcoming';
  };

  const filteredLeads = activeLeads.filter((l) => {
    if (!l.followUpDate) return false;
    const timing = getLeadTiming(l.followUpDate);
    if (filter === 'today') return timing === 'today';
    if (filter === 'overdue') return timing === 'overdue';
    if (filter === 'upcoming') return timing === 'upcoming';
    return timing !== 'none';
  });

  const todayCount = activeLeads.filter(
    (l) => l.followUpDate && getLeadTiming(l.followUpDate) === 'today'
  ).length;
  const overdueCount = activeLeads.filter(
    (l) => l.followUpDate && getLeadTiming(l.followUpDate) === 'overdue'
  ).length;
  const upcomingCount = activeLeads.filter(
    (l) => l.followUpDate && getLeadTiming(l.followUpDate) === 'upcoming'
  ).length;

  return (
    <div className="space-y-6 min-w-0">
      {/* Top filter tabs & completed toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800 w-full min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Pending ({todayCount + overdueCount + upcomingCount})
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              filter === 'today'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Due Today ({todayCount})</span>
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              filter === 'overdue'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue ({overdueCount})</span>
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              filter === 'upcoming'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming ({upcomingCount})</span>
          </button>
        </div>

        {/* Toggle to include completed / closed leads */}
        <label className="flex items-center space-x-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer select-none bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800 shrink-0">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
          />
          <span>Show Completed & Closed ({completedCount})</span>
        </label>
      </div>

      {/* Follow-ups list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.length === 0 ? (
          <div className="col-span-full glass p-12 text-center rounded-2xl border border-zinc-800">
            <CalendarClock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">
              No Follow-ups Found
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              There are no follow-ups matching this filter category.
            </p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const timing = getLeadTiming(lead.followUpDate);

            return (
              <div
                key={lead.rowIndex}
                className="glass rounded-xl p-5 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header tag and timing badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      timing === 'today'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : timing === 'overdue'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {timing === 'today'
                      ? 'Due Today'
                      : timing === 'overdue'
                      ? 'Overdue'
                      : 'Upcoming'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                    {lead.followUpDate}
                  </span>
                </div>

                {/* Lead details */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className="text-base font-bold text-zinc-100 hover:text-blue-400 cursor-pointer transition-colors"
                      onClick={() => onEditLead(lead)}
                    >
                      {lead.name}
                    </h4>
                    {lead.status && (
                      <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/80 px-2 py-0.5 rounded-md shrink-0">
                        {lead.status}
                      </span>
                    )}
                  </div>
                  {lead.contact && (
                    <div className="text-xs text-zinc-400 font-mono flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{lead.contact}</span>
                    </div>
                  )}
                  {lead.place && (
                    <div className="text-xs text-zinc-400 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{lead.place}</span>
                    </div>
                  )}
                </div>

                {/* Requirement box */}
                {lead.requirement && (
                  <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 text-xs text-zinc-300">
                    <span className="text-zinc-500 font-semibold block text-[10px] uppercase mb-0.5">
                      Requirement
                    </span>
                    {lead.requirement}
                  </div>
                )}

                {/* Footer action */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    onClick={() => onEditLead(lead)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center space-x-1 font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-blue-400" />
                    <span>View & Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      onUpdateFollowUp(
                        lead,
                        d.toLocaleDateString('en-GB') // e.g. 15/12/2025
                      );
                    }}
                    className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>+1 Week</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
