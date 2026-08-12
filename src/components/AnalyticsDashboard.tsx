import React from 'react';
import { Lead } from '../types';
import {
  TrendingUp,
  Award,
  Users,
  Target,
  BarChart3,
  PieChart,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  leads: Lead[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  leads,
}) => {
  const totalLeads = leads.length;
  const workAwarded = leads.filter(
    (l) =>
      l.status.toLowerCase().includes('award') ||
      l.status.toLowerCase().includes('complet') ||
      l.status2.toLowerCase().includes('complet')
  );

  const inPipeline = leads.filter(
    (l) =>
      !l.status.toLowerCase().includes('lost') &&
      !l.status2.toLowerCase().includes('lost') &&
      !l.status.toLowerCase().includes('complet') &&
      !l.status.toLowerCase().includes('award')
  );

  const lostCount = leads.filter(
    (l) =>
      l.status.toLowerCase().includes('lost') ||
      l.status2.toLowerCase().includes('lost')
  ).length;

  const conversionRate =
    totalLeads > 0 ? Math.round((workAwarded.length / totalLeads) * 100) : 0;

  // Pipeline Financials
  const totalPipelineVal = leads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const wonPipelineVal = workAwarded.reduce((sum, l) => sum + (l.dealValue || 0), 0);
  const leadsWithVal = leads.filter((l) => (l.dealValue || 0) > 0);
  const avgDealVal = leadsWithVal.length > 0 ? Math.round(totalPipelineVal / leadsWithVal.length) : 0;

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toLocaleString()}`;
  };

  // Group by category
  const categories: Record<string, number> = leads.reduce(
    (acc: Record<string, number>, curr) => {
      const c = curr.category || 'interior';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    },
    {}
  );

  // Group by reference
  const references: Record<string, number> = leads.reduce(
    (acc: Record<string, number>, curr) => {
      const r = curr.reference || 'Self / Direct';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Financial Valuation Summary Bar */}
      <div className="glass p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Total Pipeline Value
            </span>
            <span className="text-2xl font-bold text-emerald-300 font-mono">
              {formatCurrency(totalPipelineVal)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Won Revenue
            </span>
            <span className="text-2xl font-bold text-blue-300 font-mono">
              {formatCurrency(wonPipelineVal)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Avg Deal Size
            </span>
            <span className="text-2xl font-bold text-indigo-300 font-mono">
              {formatCurrency(avgDealVal)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Inquiries
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-light text-zinc-100">{totalLeads}</div>
          <div className="text-xs text-zinc-500 mt-1">
            Across all package categories
          </div>
        </div>

        <div className="glass p-5 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Active Pipeline
            </span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-light text-zinc-100">{inPipeline.length}</div>
          <div className="text-xs text-zinc-500 mt-1">
            In estimate & designing stages
          </div>
        </div>

        <div className="glass p-5 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Work Awarded
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-light text-zinc-100">{workAwarded.length}</div>
          <div className="text-xs text-zinc-500 mt-1">
            Completed or active execution
          </div>
        </div>

        <div className="glass p-5 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Win Rate
            </span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-light text-zinc-100">
            {conversionRate}%
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Lost: {lostCount} ({Math.round((lostCount / (totalLeads || 1)) * 100)}
            %)
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="glass p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-100 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-blue-400" />
              <span>Category Distribution</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              Interior / WI / Loose
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(categories).map(([cat, count]) => {
              const numCount = Number(count || 0);
              const pct = Math.round((numCount / (totalLeads || 1)) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium capitalize">
                      {cat}
                    </span>
                    <span className="text-zinc-400 font-mono">
                      {numCount} leads ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reference / Lead Sources */}
        <div className="glass p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-100 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-indigo-400" />
              <span>Top References & Channels</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Source count</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(references)
              .sort(([, a], [, b]) => Number(b) - Number(a))
              .slice(0, 5)
              .map(([ref, count]) => {
                const numCount = Number(count || 0);
                const pct = Math.round((numCount / (totalLeads || 1)) * 100);
                return (
                  <div
                    key={ref}
                    className="flex items-center justify-between p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800/80"
                  >
                    <span className="text-sm text-zinc-300 font-medium">
                      {ref}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono bg-zinc-800 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        {numCount} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
