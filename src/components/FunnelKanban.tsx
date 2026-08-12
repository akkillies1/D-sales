import React, { useState } from 'react';
import { Lead } from '../types';
import {
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  Edit2,
  Tag,
  DollarSign,
  Filter,
} from 'lucide-react';

interface FunnelKanbanProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onMoveStage: (lead: Lead, nextStatus: string, nextStatus2?: string) => void;
}

interface StageColumn {
  id: string;
  title: string;
  shortTitle: string;
  color: string;
  headerBg: string;
  badgeBg: string;
  matchFn: (lead: Lead) => boolean;
  nextStageName?: string;
  nextStatus?: string;
  nextStatus2?: string;
}

export const FunnelKanban: React.FC<FunnelKanbanProps> = ({
  leads,
  onEditLead,
  onMoveStage,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);

  // Define 5 clean, standard CRM funnel pipeline stages
  const stages: StageColumn[] = [
    {
      id: 'new',
      title: '1. New Inquiry / Reference',
      shortTitle: 'New Inquiries',
      color: 'border-blue-500/50',
      headerBg: 'bg-blue-500/10 text-blue-300',
      badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      matchFn: (l) => {
        const s = (l.status || '').toLowerCase();
        const s2 = (l.status2 || '').toLowerCase();
        if (!s || s === 'new' || s === 'new inquiry' || s === '') return true;
        if (s.includes('inquir') || s.includes('refer') || s.includes('visit') || s.includes('lead')) {
          return !s.includes('estimate') && !s.includes('design') && !s.includes('award') && !s.includes('complet') && !s.includes('lost');
        }
        return false;
      },
      nextStageName: 'Send Estimate',
      nextStatus: 'Estimate submitted',
      nextStatus2: 'under designing',
    },
    {
      id: 'estimate',
      title: '2. Estimate Submitted',
      shortTitle: 'Estimates',
      color: 'border-indigo-500/50',
      headerBg: 'bg-indigo-500/10 text-indigo-300',
      badgeBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      matchFn: (l) => {
        const s = (l.status || '').toLowerCase();
        const s2 = (l.status2 || '').toLowerCase();
        return (
          (s.includes('estimate') || s.includes('quote') || s.includes('propos') || s.includes('budget')) &&
          !s2.includes('lost') &&
          !s.includes('lost')
        );
      },
      nextStageName: 'Start Design',
      nextStatus: 'waiting for the design confirmation',
      nextStatus2: 'under designing',
    },
    {
      id: 'designing',
      title: '3. Under Designing',
      shortTitle: 'Designing',
      color: 'border-cyan-500/50',
      headerBg: 'bg-cyan-500/10 text-cyan-300',
      badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      matchFn: (l) => {
        const s = (l.status || '').toLowerCase();
        const s2 = (l.status2 || '').toLowerCase();
        return (
          (s.includes('design') || s2.includes('design') || s.includes('waiting') || s.includes('layout') || s.includes('draw')) &&
          !s2.includes('lost') &&
          !s.includes('lost') &&
          !s.includes('award') &&
          !s.includes('complet')
        );
      },
      nextStageName: 'Award Work',
      nextStatus: 'Work awarded',
      nextStatus2: 'In Progress',
    },
    {
      id: 'awarded',
      title: '4. Work Awarded / Won',
      shortTitle: 'Won / Awarded',
      color: 'border-emerald-500/50',
      headerBg: 'bg-emerald-500/10 text-emerald-300',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      matchFn: (l) => {
        const s = (l.status || '').toLowerCase();
        const s2 = (l.status2 || '').toLowerCase();
        return (
          s.includes('award') ||
          s.includes('complet') ||
          s.includes('finish') ||
          s.includes('won') ||
          s2.includes('complet')
        );
      },
    },
    {
      id: 'lost',
      title: '5. Lost / Closed',
      shortTitle: 'Lost / Closed',
      color: 'border-rose-500/50',
      headerBg: 'bg-rose-500/10 text-rose-300',
      badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      matchFn: (l) => {
        const s = (l.status || '').toLowerCase();
        const s2 = (l.status2 || '').toLowerCase();
        return (
          s.includes('lost') ||
          s2.includes('lost') ||
          s.includes('reject') ||
          s.includes('cancel') ||
          s.includes('close')
        );
      },
    },
  ];

  // Helper: check if a lead matches any standard stage
  const matchedLeads = new Set<number>();
  stages.forEach((st) => {
    leads.forEach((l) => {
      if (st.matchFn(l)) matchedLeads.add(l.rowIndex);
    });
  });

  // Catch unclassified leads so nothing gets hidden
  const unclassifiedLeads = leads.filter((l) => !matchedLeads.has(l.rowIndex));

  // Category & active filters
  const filteredLeads = leads.filter((l) => {
    if (selectedCategory !== 'all') {
      if ((l.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }
    if (showOnlyActive) {
      const s = (l.status || '').toLowerCase();
      const s2 = (l.status2 || '').toLowerCase();
      if (s.includes('complet') || s.includes('award') || s.includes('lost') || s2.includes('lost') || s2.includes('complet')) {
        return false;
      }
    }
    return true;
  });

  const formatCurrency = (val: number) => {
    if (!val || val === 0) return null;
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 min-h-0">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/70 p-3 rounded-2xl border border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 font-semibold flex items-center mr-1">
            <Filter className="w-3.5 h-3.5 mr-1 text-zinc-500" /> Filter Stage:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            All Categories ({leads.length})
          </button>
          <button
            onClick={() => setSelectedCategory('interior')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'interior'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Interior
          </button>
          <button
            onClick={() => setSelectedCategory('loose furniture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'loose furniture'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            Loose Furniture
          </button>
          <button
            onClick={() => setSelectedCategory('wi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'wi'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
            }`}
          >
            WI / Modular
          </button>
        </div>

        <label className="flex items-center space-x-2 text-xs text-zinc-400 hover:text-white cursor-pointer select-none bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-800">
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
            className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
          />
          <span>Hide Completed / Lost Leads</span>
        </label>
      </div>

      {/* Column Pipeline Grid */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-[1200px] h-full items-start">
          {stages.map((stage) => {
            const columnLeads = filteredLeads.filter(stage.matchFn);
            
            // If Stage 1, also append any unclassified leads so nothing is ever missing!
            if (stage.id === 'new' && unclassifiedLeads.length > 0) {
              unclassifiedLeads.forEach((u) => {
                if (!columnLeads.some((cl) => cl.rowIndex === u.rowIndex)) {
                  columnLeads.push(u);
                }
              });
            }

            const colValueSum = columnLeads.reduce(
              (sum, l) => sum + (l.dealValue || 0),
              0
            );

            return (
              <div
                key={stage.id}
                className={`flex flex-col rounded-2xl border-t-2 ${stage.color} bg-[#121216]/90 border border-zinc-800/80 p-3.5 shadow-xl min-h-[600px] max-h-[calc(100vh-220px)] overflow-hidden`}
              >
                {/* Column Header */}
                <div className="flex flex-col pb-3 mb-3 border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 truncate">
                      {stage.shortTitle}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${stage.badgeBg}`}>
                      {columnLeads.length}
                    </span>
                  </div>
                  {colValueSum > 0 && (
                    <div className="text-[11px] font-mono text-zinc-400 flex items-center space-x-1 mt-1">
                      <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-semibold">{formatCurrency(colValueSum)}</span>
                    </div>
                  )}
                </div>

                {/* Cards Stack */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {columnLeads.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-600 font-medium">
                      No leads in this stage
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.rowIndex}
                        onClick={() => onEditLead(lead)}
                        className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/90 hover:border-zinc-700 rounded-xl p-3 space-y-2.5 transition-all cursor-pointer group shadow-sm relative"
                      >
                        {/* Header: Name & SL No */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                                #{lead.slNo}
                              </span>
                              <h4 className="text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition-colors leading-tight truncate max-w-[160px]">
                                {lead.name}
                              </h4>
                            </div>
                            {lead.contact && (
                              <div className="text-[11px] text-zinc-400 flex items-center space-x-1 mt-1 font-mono">
                                <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>{lead.contact}</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditLead(lead);
                            }}
                            className="text-zinc-500 hover:text-white p-1 rounded transition-colors opacity-80 group-hover:opacity-100"
                            title="Edit Lead Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Requirement Preview */}
                        {lead.requirement && (
                          <div className="text-xs text-zinc-300 line-clamp-2 bg-black/40 px-2.5 py-1.5 rounded-lg border border-zinc-800/80 leading-snug">
                            {lead.requirement}
                          </div>
                        )}

                        {/* Location, Category & Date Footer */}
                        <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-1 pt-1 border-t border-zinc-800/50">
                          <div className="flex items-center space-x-2">
                            {lead.place && (
                              <span className="flex items-center text-zinc-300 truncate max-w-[100px]">
                                <MapPin className="w-3 h-3 mr-0.5 text-zinc-500 shrink-0" />
                                {lead.place}
                              </span>
                            )}
                            {lead.category && (
                              <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 uppercase">
                                {lead.category}
                              </span>
                            )}
                          </div>

                          {lead.followUpDate && (
                            <span className="flex items-center font-mono text-zinc-400 shrink-0">
                              <Calendar className="w-3 h-3 mr-1 text-zinc-500" />
                              {lead.followUpDate}
                            </span>
                          )}
                        </div>

                        {/* Clean Advance Stage Button */}
                        {stage.nextStageName && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (stage.nextStatus) {
                                  onMoveStage(
                                    lead,
                                    stage.nextStatus,
                                    stage.nextStatus2 || ''
                                  );
                                }
                              }}
                              className="bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1"
                            >
                              <span>{stage.nextStageName}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
