import React from 'react';
import { Plus, Columns, Search, RefreshCw, Filter, ShieldCheck, Menu } from 'lucide-react';
import { SUPPORT_PHONE_LINK, WHATSAPP_LINK } from '../config';
import ContactModal from './ContactModal';
import { useState } from 'react';
import { FilterState } from '../types';

interface HeaderProps {
  totalLeadsCount: number;
  placesCount: number;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  onOpenNewLeadModal: () => void;
  onOpenAddFieldModal: () => void;
  onRefreshSheet: () => void;
  isLoading: boolean;
  isDemoMode: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalLeadsCount,
  placesCount,
  filterState,
  setFilterState,
  onOpenNewLeadModal,
  onOpenAddFieldModal,
  onRefreshSheet,
  isLoading,
  isDemoMode,
  onToggleMobileMenu,
}) => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  return (
    <header className="mb-6 space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg bg-zinc-800/90 border border-zinc-700/80 text-zinc-300 hover:text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
                  Lead Management
                </h2>
                {isDemoMode ? (
                  <span className="text-[10px] sm:text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                    Demo Sheet
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Live Sync
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
                <span className="text-zinc-300 font-semibold">{totalLeadsCount}</span> leads •{' '}
                <span className="text-zinc-300 font-semibold">{placesCount}</span> locations
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onRefreshSheet}
            disabled={isLoading}
            title="Sync with Google Sheet"
            className="flex-1 sm:flex-initial bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-zinc-300 flex items-center justify-center transition-all hover:text-white"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 ${
                isLoading ? 'animate-spin text-blue-400' : 'text-zinc-400'
              }`}
            />
            <span>Sync</span>
          </button>

          <button
            onClick={onOpenAddFieldModal}
            className="flex-1 sm:flex-initial bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-zinc-200 flex items-center justify-center transition-all hover:border-zinc-600 shadow-sm"
          >
            <Columns className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-blue-400" />
            <span>Add Field</span>
          </button>

          <button
            onClick={onOpenNewLeadModal}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Lead</span>
          </button>

          {/* Contact buttons for mobile */}
          {SUPPORT_PHONE_LINK && (
            <a href={SUPPORT_PHONE_LINK} className="md:hidden ml-2 text-xs text-zinc-300 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">Call</a>
          )}
          {WHATSAPP_LINK && (
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="md:hidden ml-2 text-xs text-white px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500">WhatsApp</a>
          )}
          <button onClick={() => setIsContactOpen(true)} className="md:hidden ml-2 text-xs text-zinc-300 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700">Contact</button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search leads, place, contact..."
            value={filterState.search}
            onChange={(e) =>
              setFilterState((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={filterState.status}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, status: e.target.value }))
              }
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="New Inquiry">New Inquiry</option>
              <option value="Estimate submitted">Estimate submitted</option>
              <option value="waiting for the design confirmation">
                Waiting for Design
              </option>
              <option value="Work awarded">Work awarded</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={filterState.category}
            onChange={(e) =>
              setFilterState((prev) => ({ ...prev, category: e.target.value }))
            }
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer shrink-0"
          >
            <option value="">All Categories</option>
            <option value="interior">Interior</option>
            <option value="loose Furniture font-normal">Loose Furniture</option>
            <option value="WI">WI / Modular</option>
          </select>

          {/* Clear filters button if any applied */}
          {(filterState.search ||
            filterState.status ||
            filterState.category ||
            filterState.place) && (
            <button
              onClick={() =>
                setFilterState({
                  search: '',
                  status: '',
                  category: '',
                  place: '',
                  followUpFilter: 'all',
                })
              }
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded bg-zinc-800/60 border border-zinc-700/60 shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
