import React, { useState } from 'react';
import { Lead } from '../types';
import { DEFAULT_HEADERS } from '../services/googleSheets';
import { Edit2, Phone, MapPin, Calendar, Tag, Trash2, ArrowUpDown } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  headers: string[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  onQuickStatusChange?: (lead: Lead, newStatus: string) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  headers,
  onEditLead,
  onDeleteLead,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(25);
  const [sortField, setSortField] = useState<'date' | 'name' | 'place'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Identify any custom columns beyond standard headers
  const customHeaders = headers.filter(
    (h) => !DEFAULT_HEADERS.some((dh) => dh.toLowerCase() === h.trim().toLowerCase())
  );

  // Sorting
  const sortedLeads = [...leads].sort((a, b) => {
    if (sortField === 'name') {
      return sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortField === 'place') {
      return sortAsc
        ? a.place.localeCompare(b.place)
        : b.place.localeCompare(a.place);
    }
    return sortAsc ? a.rowIndex - b.rowIndex : b.rowIndex - a.rowIndex;
  });

  const effectiveItemsPerPage = itemsPerPage === 'all' ? sortedLeads.length || 1 : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / effectiveItemsPerPage));
  
  const displayLeads = itemsPerPage === 'all'
    ? sortedLeads
    : sortedLeads.slice(
        (currentPage - 1) * effectiveItemsPerPage,
        currentPage * effectiveItemsPerPage
      );

  const renderStatusChip = (status: string, status2: string) => {
    const sLower = (status || '').toLowerCase();
    const s2Lower = (status2 || '').toLowerCase();

    let chipClass = 'bg-zinc-800/80 text-zinc-300 border-zinc-700/80';
    let label = status || status2 || 'New Inquiry';

    if (
      sLower.includes('work awarded') ||
      sLower.includes('complet') ||
      s2Lower.includes('complet')
    ) {
      chipClass = 'status-completed';
      label = sLower.includes('complet') || s2Lower.includes('complet') ? 'Completed' : 'Work Awarded';
    } else if (
      sLower.includes('design') ||
      s2Lower.includes('design') ||
      sLower.includes('waiting')
    ) {
      chipClass = 'status-designing';
      label = sLower.includes('waiting') ? 'Waiting Design' : 'Designing';
    } else if (sLower.includes('lost') || s2Lower.includes('lost')) {
      chipClass = 'status-lost';
      label = 'Lost';
    } else if (sLower.includes('estimate')) {
      chipClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      label = 'Estimate Sent';
    }

    return (
      <span className={`status-chip border px-2 py-0.5 inline-flex items-center ${chipClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col border border-zinc-800/80 shadow-2xl">
      <div className="overflow-x-auto h-full">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-900/80 text-[11px] uppercase text-zinc-500 font-bold border-b border-zinc-800 tracking-wider">
            <tr>
              <th className="px-5 py-4 w-12 text-center">Sl</th>
              <th
                className="px-5 py-4 cursor-pointer hover:text-zinc-300 transition-colors"
                onClick={() => {
                  setSortField('date');
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="px-5 py-4 cursor-pointer hover:text-zinc-300 transition-colors"
                onClick={() => {
                  setSortField('name');
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center space-x-1">
                  <span>Name & Contact</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="px-5 py-4 cursor-pointer hover:text-zinc-300 transition-colors"
                onClick={() => {
                  setSortField('place');
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center space-x-1">
                  <span>Place</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-5 py-4">Requirement</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Follow Up</th>
              <th className="px-5 py-4">Status</th>
              {/* Dynamic custom columns */}
              {customHeaders.map((col) => (
                <th key={col} className="px-5 py-4 text-blue-400 font-semibold">
                  {col}
                </th>
              ))}
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 text-sm">
            {displayLeads.length === 0 ? (
              <tr>
                <td
                  colSpan={9 + customHeaders.length}
                  className="px-6 py-12 text-center text-zinc-500 font-medium"
                >
                  No leads match the current filters.
                </td>
              </tr>
            ) : (
              displayLeads.map((lead) => (
                <tr
                  key={lead.rowIndex}
                  className="table-row transition-colors"
                  onClick={() => onEditLead(lead)}
                >
                  <td className="px-5 py-4 text-zinc-500 font-mono text-xs text-center">
                    {lead.slNo}
                  </td>
                  <td className="px-5 py-4 text-zinc-400 font-mono text-xs whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{lead.date || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-zinc-200">
                    <div className="font-semibold text-zinc-100">{lead.name}</div>
                    {lead.contact && (
                      <div className="text-xs text-zinc-500 flex items-center space-x-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-zinc-600" />
                        <span>{lead.contact}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-zinc-300">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <span>{lead.place || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-300 max-w-xs">
                    <div className="truncate" title={lead.requirement}>
                      {lead.requirement || '—'}
                    </div>
                    {lead.reference && (
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Ref: <span className="text-zinc-400">{lead.reference}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                      <Tag className="w-3 h-3 mr-1 text-blue-500/80" />
                      {lead.category || 'interior'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-400 font-mono text-xs whitespace-nowrap">
                    {lead.followUpDate || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col space-y-1.5 max-w-xs">
                      <div>{renderStatusChip(lead.status, lead.status2)}</div>
                      {lead.status2 && lead.status2 !== 'Completed' && (
                        <div
                          className="text-[11px] text-zinc-300 bg-black/40 border border-zinc-800/80 rounded-md px-2 py-1 leading-snug line-clamp-2"
                          title={lead.status2}
                        >
                          <span className="font-semibold text-blue-400 mr-1">💬</span>
                          <span>{lead.status2}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Render any custom dynamically added column cells */}
                  {customHeaders.map((col) => (
                    <td key={col} className="px-5 py-4 text-zinc-300">
                      {lead.customFields[col] || '—'}
                    </td>
                  ))}

                  <td
                    className="px-5 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEditLead(lead)}
                        title="Edit Lead"
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead)}
                        title="Delete Lead"
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table footer matching design HTML */}
      <footer className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 flex flex-col sm:flex-row justify-between items-center gap-3 select-none">
        <div className="flex items-center space-x-4 text-xs text-zinc-500">
          <div>
            Displaying{' '}
            <span className="text-zinc-300 font-semibold">{displayLeads.length}</span> of{' '}
            <span className="text-zinc-300 font-semibold">{leads.length}</span> leads
          </div>
          <div className="flex items-center space-x-1.5">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              className="bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value="all">All ({leads.length})</option>
            </select>
          </div>
        </div>
        {itemsPerPage !== 'all' && totalPages > 1 && (
          <div className="flex space-x-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 h-8 flex items-center justify-center bg-zinc-800/80 rounded border border-zinc-700/80 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isCurrent = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white border border-blue-500 font-bold'
                      : 'hover:bg-zinc-800/80 text-zinc-400 border border-transparent'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 h-8 flex items-center justify-center bg-zinc-800/80 rounded border border-zinc-700/80 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium"
            >
              Next
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
