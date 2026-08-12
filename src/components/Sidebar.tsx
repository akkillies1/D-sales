import React from 'react';
import { ActiveTab, SheetMetadata } from '../types';
import {
  LayoutDashboard,
  Table,
  Kanban,
  CalendarClock,
  Database,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sheetMetadata: SheetMetadata;
  onOpenConnectModal: () => void;
  onRefreshSheet: () => void;
  isLoading: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sheetMetadata,
  onOpenConnectModal,
  onRefreshSheet,
  isLoading,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'table',
      label: 'Lead Pipeline',
      icon: <Table className="w-4 h-4" />,
    },
    {
      id: 'kanban',
      label: 'Sales Funnel',
      icon: <Kanban className="w-4 h-4" />,
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      icon: <CalendarClock className="w-4 h-4" />,
    },
    {
      id: 'dashboard',
      label: 'Analytics',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
  ];

  const handleSelectTab = (id: ActiveTab) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100 leading-none">
              SalesFlow Pro
            </h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Google Sheets CRM</p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider px-2 mb-2">
          Views
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 text-sm px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <span
                className={`${isActive ? 'text-blue-400' : 'text-zinc-500'}`}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Google Sheet Connection Card */}
      <div className="mt-auto border-t border-zinc-800/80 pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500 uppercase font-bold tracking-widest">
            Database
          </div>
          <button
            onClick={onRefreshSheet}
            disabled={isLoading}
            title="Sync with Google Sheet"
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`}
            />
          </button>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center font-medium">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  sheetMetadata.isDemoMode
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
                }`}
              ></span>
              {sheetMetadata.isDemoMode ? 'Demo / Offline' : 'Live Sheet'}
            </span>
            <span className="text-[10px] font-semibold bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
              G-SHEETS
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 truncate font-mono">
            ID: {sheetMetadata.spreadsheetId.slice(0, 10)}...
          </p>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => {
                onOpenConnectModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-1.5 px-2.5 rounded-lg transition-colors border border-zinc-700 font-medium flex items-center justify-center space-x-1.5"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>{sheetMetadata.isDemoMode ? 'Connect OAuth' : 'Settings'}</span>
            </button>
            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetMetadata.spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Google Sheet in new tab"
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800/80 flex-col p-6 space-y-8 bg-[#0A0A0B] select-none shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-[#0A0A0B] border-r border-zinc-800/90 p-5 flex flex-col space-y-6 h-full z-50 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
