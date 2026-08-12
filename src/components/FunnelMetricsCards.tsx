import React from 'react';
import { Lead } from '../types';

interface FunnelMetricsCardsProps {
  leads: Lead[];
}

export const FunnelMetricsCards: React.FC<FunnelMetricsCardsProps> = ({
  leads,
}) => {
  const totalLeads = leads.length;

  const newInquiries = leads.filter(
    (l) =>
      !l.status ||
      l.status.toLowerCase().includes('new') ||
      l.status.toLowerCase().includes('inquiry') ||
      l.status.toLowerCase().includes('reference') ||
      l.status === ''
  ).length;

  const estimatesSent = leads.filter((l) =>
    l.status.toLowerCase().includes('estimate')
  ).length;

  const designingCount = leads.filter(
    (l) =>
      l.status.toLowerCase().includes('design') ||
      l.status2.toLowerCase().includes('design') ||
      l.status.toLowerCase().includes('waiting')
  ).length;

  const workAwarded = leads.filter(
    (l) =>
      l.status.toLowerCase().includes('award') ||
      l.status.toLowerCase().includes('complet') ||
      l.status2.toLowerCase().includes('complet')
  ).length;

  const conversionRate =
    totalLeads > 0 ? Math.round((workAwarded / totalLeads) * 100) : 0;

  // Funnel bar width calculations based on REAL numbers
  const newPct = totalLeads > 0 ? Math.round((newInquiries / totalLeads) * 100) : 0;
  const estimatesPercentage = totalLeads > 0 ? Math.round((estimatesSent / totalLeads) * 100) : 0;
  const designingPercentage = totalLeads > 0 ? Math.round((designingCount / totalLeads) * 100) : 0;

  return (
    <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* New Inquiries */}
      <div className="glass p-4 rounded-xl border border-zinc-800/80 transition-all hover:border-zinc-700/80 bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
            New Inquiries
          </p>
          <span className="text-[10px] text-blue-400 font-mono font-semibold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
            Stage 1 • {newPct}%
          </span>
        </div>
        <p className="text-3xl font-semibold text-zinc-100 mt-1">
          {newInquiries}
        </p>
        <div className="funnel-bar mt-3 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="funnel-fill h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${newPct}%` }}
          ></div>
        </div>
      </div>

      {/* Estimates Sent */}
      <div className="glass p-4 rounded-xl border border-zinc-800/80 transition-all hover:border-zinc-700/80 bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
            Estimates Sent
          </p>
          <span className="text-[10px] text-indigo-400 font-mono font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            Stage 2 • {estimatesPercentage}%
          </span>
        </div>
        <p className="text-3xl font-semibold text-zinc-100 mt-1">
          {estimatesSent}
        </p>
        <div className="funnel-bar mt-3 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="funnel-fill h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${estimatesPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Under Designing */}
      <div className="glass p-4 rounded-xl border border-zinc-800/80 transition-all hover:border-zinc-700/80 bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
            Under Designing
          </p>
          <span className="text-[10px] text-cyan-400 font-mono font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
            Stage 3 • {designingPercentage}%
          </span>
        </div>
        <p className="text-3xl font-semibold text-zinc-100 mt-1">
          {designingCount}
        </p>
        <div className="funnel-bar mt-3 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="funnel-fill h-full bg-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${designingPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="glass p-4 rounded-xl border border-zinc-800/80 transition-all hover:border-zinc-700/80 bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">
            Conversion Rate
          </p>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {workAwarded} Won
          </span>
        </div>
        <p className="text-3xl font-semibold text-zinc-100 mt-1">
          {conversionRate}%
        </p>
        <div className="funnel-bar mt-3 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="funnel-fill h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${conversionRate}%` }}
          ></div>
        </div>
      </div>
    </section>
  );
};

