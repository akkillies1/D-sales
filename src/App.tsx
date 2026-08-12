import React, { useState, useEffect, useMemo } from 'react';
import {
  Lead,
  SheetMetadata,
  ActiveTab,
  FilterState,
} from './types';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_HEADERS,
  syncOrCreateGoogleSheet,
  syncGoogleSheetData,
  appendRowToSheet,
  updateRowInSheet,
  appendHeaderColumn,
  clearRowInSheet,
} from './services/googleSheets';
import { googleSignIn, initAuth, googleSignOut } from './services/googleAuth';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import Landing from './components/Landing';
import { FunnelMetricsCards } from './components/FunnelMetricsCards';
import { LeadTable } from './components/LeadTable';
import { FunnelKanban } from './components/FunnelKanban';
import { FollowUpView } from './components/FollowUpView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { LeadModal } from './components/LeadModal';
import { AddFieldModal } from './components/AddFieldModal';
import { ConnectSheetModal } from './components/ConnectSheetModal';
import { ColumnMapperModal } from './components/ColumnMapperModal';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('table');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [headers, setHeaders] = useState<string[]>(DEFAULT_HEADERS);
  const [sheetMetadata, setSheetMetadata] = useState<SheetMetadata>({
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    title: 'SalesFlow Pro CRM Sheet',
    sheetName: 'Sheet1',
    headers: DEFAULT_HEADERS,
    lastSynced: new Date(),
    isDemoMode: false,
    autoSyncInterval: 30,
  });
  const [oauthToken, setOauthToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    status: '',
    category: '',
    place: '',
    followUpFilter: 'all',
  });

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isColumnMapperOpen, setIsColumnMapperOpen] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Check localStorage for saved token or custom fields on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('google_sheets_token');
      const savedSheetId = localStorage.getItem('google_spreadsheet_id');
      const savedTab = localStorage.getItem('google_sheet_tab');
      if (savedToken && savedSheetId) {
        setOauthToken(savedToken);
        setSheetMetadata((prev) => ({
          ...prev,
          spreadsheetId: savedSheetId,
          sheetName: savedTab || prev.sheetName,
          isDemoMode: false,
        }));
        // only attempt sync if user is signed in; initAuth will call onAuthSuccess if available
      } else {
        const savedLeads = localStorage.getItem('salesflow_leads_state');
        const savedHeaders = localStorage.getItem('salesflow_headers_state');
        if (savedLeads) {
          setLeads(JSON.parse(savedLeads));
        }
        if (savedHeaders) {
          setHeaders(JSON.parse(savedHeaders));
        }
      }
    } catch (e) {
      // ignore localStorage errors in sandbox
    }
  }, []);

  // Initialize Firebase auth listener to track sign-in state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) {
          setOauthToken(token);
          try {
            localStorage.setItem('google_sheets_token', token);
          } catch (e) {}
        }
      },
      () => {
        setCurrentUser(null);
        setOauthToken('');
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // When signed in and we have a saved spreadsheet id + token, auto-sync once
  useEffect(() => {
    const tryAutoSync = async () => {
      try {
        const savedSheetId = localStorage.getItem('google_spreadsheet_id');
        if (currentUser && oauthToken && savedSheetId) {
          await handleSyncWithGoogle(savedSheetId, oauthToken, localStorage.getItem('google_sheet_tab') || undefined);
        }
      } catch (e) {
        // ignore
      }
    };
    tryAutoSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, oauthToken]);

  // Persist demo changes locally
  const persistState = (newLeads: Lead[], newHeaders: string[]) => {
    try {
      localStorage.setItem('salesflow_leads_state', JSON.stringify(newLeads));
      localStorage.setItem(
        'salesflow_headers_state',
        JSON.stringify(newHeaders)
      );
    } catch (e) {
      // ignore
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setOauthToken(result.accessToken);
        try {
          localStorage.setItem('google_sheets_token', result.accessToken);
        } catch (e) {}
        // optionally sync if spreadsheet id present
        const savedSheetId = localStorage.getItem('google_spreadsheet_id');
        if (savedSheetId) {
          await handleSyncWithGoogle(savedSheetId, result.accessToken);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
    } catch (e) {}
    setCurrentUser(null);
    setOauthToken('');
    try {
      localStorage.removeItem('google_sheets_token');
    } catch (e) {}
  };

  // Sync from live Google Sheet or auto-create in Google Drive
  const handleSyncWithGoogle = async (
    spreadsheetId: string,
    token: string,
    selectedTabName?: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await syncOrCreateGoogleSheet(spreadsheetId, token, selectedTabName);
      setLeads(result.leads);
      setHeaders(result.headers);
      setOauthToken(token);
      setSheetMetadata((prev) => ({
        ...prev,
        spreadsheetId: result.spreadsheetId,
        title: result.title || prev.title,
        sheetName: result.sheetName || 'Sheet1',
        availableSheets: result.availableSheets,
        headers: result.headers,
        lastSynced: new Date(),
        isDemoMode: false,
      }));
      try {
        localStorage.setItem('google_sheets_token', token);
        localStorage.setItem('google_spreadsheet_id', result.spreadsheetId);
        if (result.sheetName) {
          localStorage.setItem('google_sheet_tab', result.sheetName);
        }
      } catch (e) {}
      showToast(`Synced successfully with Google Sheet "${result.title}" (${result.sheetName})!`);
    } catch (err: any) {
      showToast(`Sheet Sync Notice: ${err.message || 'Using offline demo data'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Background Auto-Polling Interval for real-time sync
  useEffect(() => {
    const intervalSec = sheetMetadata.autoSyncInterval ?? 30;
    if (intervalSec <= 0 || sheetMetadata.isDemoMode || !oauthToken || !sheetMetadata.spreadsheetId) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const result = await syncGoogleSheetData(
          sheetMetadata.spreadsheetId,
          oauthToken,
          sheetMetadata.sheetName,
          sheetMetadata.customColumnMapping
        );
        if (result.leads) {
          setLeads(result.leads);
          setHeaders(result.headers);
          setSheetMetadata((prev) => ({ ...prev, lastSynced: new Date() }));
        }
      } catch (e) {
        // quiet background catch
      }
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [
    oauthToken,
    sheetMetadata.spreadsheetId,
    sheetMetadata.sheetName,
    sheetMetadata.autoSyncInterval,
    sheetMetadata.isDemoMode,
    sheetMetadata.customColumnMapping,
  ]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filterState.search) {
        const query = filterState.search.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(query);
        const matchesContact = lead.contact.toLowerCase().includes(query);
        const matchesPlace = lead.place.toLowerCase().includes(query);
        const matchesReq = lead.requirement.toLowerCase().includes(query);
        const matchesRef = lead.reference.toLowerCase().includes(query);
        const matchesCustom = Object.values(lead.customFields || {}).some((val) =>
          String(val || '').toLowerCase().includes(query)
        );
        if (
          !matchesName &&
          !matchesContact &&
          !matchesPlace &&
          !matchesReq &&
          !matchesRef &&
          !matchesCustom
        ) {
          return false;
        }
      }

      if (
        filterState.status &&
        lead.status.toLowerCase() !== filterState.status.toLowerCase() &&
        !lead.status.toLowerCase().includes(filterState.status.toLowerCase())
      ) {
        return false;
      }

      if (
        filterState.category &&
        lead.category.toLowerCase() !== filterState.category.toLowerCase() &&
        !lead.category.toLowerCase().includes(filterState.category.toLowerCase())
      ) {
        return false;
      }

      if (
        filterState.place &&
        lead.place.toLowerCase() !== filterState.place.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [leads, filterState]);

  // Unique places count
  const uniquePlaces = useMemo(() => {
    const places = new Set<string>();
    leads.forEach((l) => {
      if (l.place) places.add(l.place.trim());
    });
    return places.size;
  }, [leads]);

  // Handle Create or Update Lead
  const handleSaveLead = async (lead: Lead) => {
    const isEdit = lead.rowIndex > 0;
    let nextLeads: Lead[];

    if (isEdit) {
      nextLeads = leads.map((l) =>
        l.rowIndex === lead.rowIndex ? lead : l
      );
    } else {
      const maxRowIndex =
        leads.length > 0
          ? Math.max(...leads.map((l) => l.rowIndex))
          : 1;
      const newLead: Lead = {
        ...lead,
        rowIndex: maxRowIndex + 1,
      };
      nextLeads = [...leads, newLead];
    }

    setLeads(nextLeads);
    persistState(nextLeads, headers);

    if (isEdit) {
      showToast(`Updated "${lead.name}" successfully!`);
    } else {
      showToast(`Added new lead "${lead.name}" to table!`);
    }

    // Sync to live Google Sheet if token is present
    if (!sheetMetadata.isDemoMode && oauthToken) {
      try {
        if (isEdit) {
          await updateRowInSheet(
            sheetMetadata.spreadsheetId,
            sheetMetadata.sheetName,
            lead,
            headers,
            oauthToken
          );
        } else {
          const createdLead = nextLeads[nextLeads.length - 1];
          const appendRes = await appendRowToSheet(
            sheetMetadata.spreadsheetId,
            sheetMetadata.sheetName,
            createdLead,
            headers,
            oauthToken
          );
          if (appendRes?.updatedRowIndex) {
            const actualRowIdx = appendRes.updatedRowIndex;
            setLeads((prev) =>
              prev.map((l) =>
                l === createdLead || (l.slNo === createdLead.slNo && l.rowIndex === createdLead.rowIndex)
                  ? { ...l, rowIndex: actualRowIdx }
                  : l
              )
            );
          }
        }
      } catch (err: any) {
        showToast(
          `Local saved! Google Sheet sync error: ${err.message}`
        );
      }
    }
  };

  // Delete lead
  const handleDeleteLead = async (lead: Lead) => {
    if (!window.confirm(`Remove inquiry for "${lead.name}"?`)) {
      return;
    }
    const nextLeads = leads.filter((l) => l.rowIndex !== lead.rowIndex);
    setLeads(nextLeads);
    persistState(nextLeads, headers);
    showToast(`Removed "${lead.name}" from leads list`);

    if (!sheetMetadata.isDemoMode && oauthToken && lead.rowIndex > 0) {
      try {
        await clearRowInSheet(
          sheetMetadata.spreadsheetId,
          sheetMetadata.sheetName,
          lead.rowIndex,
          headers,
          oauthToken
        );
      } catch (err: any) {
        showToast(`Removed locally! Google Sheet note: ${err.message}`);
      }
    }
  };

  // 1-Click stage move from Kanban
  const handleMoveStage = async (
    lead: Lead,
    nextStatus: string,
    nextStatus2?: string
  ) => {
    const updated: Lead = {
      ...lead,
      status: nextStatus,
      status2: nextStatus2 || lead.status2,
    };
    await handleSaveLead(updated);
  };

  // 1-Click follow-up date update
  const handleUpdateFollowUpDate = async (lead: Lead, nextDate: string) => {
    const updated: Lead = {
      ...lead,
      followUpDate: nextDate,
    };
    await handleSaveLead(updated);
    showToast(`Rescheduled follow-up for ${lead.name} to ${nextDate}`);
  };

  // Dynamically add a new column header to the table and Google Sheet!
  const handleAddFieldColumn = async (fieldName: string) => {
    const cleanName = fieldName.trim();
    if (
      headers.some((h) => h.toLowerCase() === cleanName.toLowerCase())
    ) {
      return;
    }

    const nextHeaders = [...headers, cleanName];
    setHeaders(nextHeaders);
    persistState(leads, nextHeaders);
    showToast(`Added column "${cleanName}" to your table and Sheet!`);

    if (!sheetMetadata.isDemoMode && oauthToken) {
      try {
        await appendHeaderColumn(
          sheetMetadata.spreadsheetId,
          sheetMetadata.sheetName,
          cleanName,
          headers.length,
          oauthToken
        );
      } catch (err: any) {
        showToast(`Column added locally! Google Sheet note: ${err.message}`);
      }
    }
  };

  const nextSlNo = useMemo(() => {
    if (leads.length === 0) return '1';
    const numVals = leads
      .map((l) => parseInt(l.slNo, 10))
      .filter((n) => !isNaN(n));
    if (numVals.length === 0) return String(leads.length + 1);
    return String(Math.max(...numVals) + 1);
  }, [leads]);

  // Require sign-in for production usage: show marketing / sign-in page when not authenticated
  if (!currentUser) {
    return <Landing onSignIn={handleSignIn} isLoading={isLoading} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#0A0A0B] text-[#E4E4E7] overflow-hidden select-none">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sheetMetadata={sheetMetadata}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onRefreshSheet={() => {
          if (!sheetMetadata.isDemoMode && oauthToken) {
            handleSyncWithGoogle(sheetMetadata.spreadsheetId, oauthToken);
          } else {
            showToast('Refreshed leads! (Demo Mode)');
          }
        }}
        isLoading={isLoading}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-3.5 sm:p-6 md:p-8 bg-[#0D0D0F] overflow-y-auto min-w-0">
        <Header
          totalLeadsCount={leads.length}
          placesCount={uniquePlaces}
          filterState={filterState}
          setFilterState={setFilterState}
          onOpenNewLeadModal={() => {
            setEditingLead(null);
            setIsLeadModalOpen(true);
          }}
          onOpenAddFieldModal={() => setIsAddFieldModalOpen(true)}
          onRefreshSheet={() => {
            if (!sheetMetadata.isDemoMode && oauthToken) {
              handleSyncWithGoogle(sheetMetadata.spreadsheetId, oauthToken);
            } else {
              showToast('Demo offline sheet is up to date.');
            }
          }}
          isLoading={isLoading}
          isDemoMode={sheetMetadata.isDemoMode}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Funnel Overview Metrics Cards */}
        <FunnelMetricsCards leads={filteredLeads} />

        {/* Main Tab Views */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'table' && (
            <LeadTable
              leads={filteredLeads}
              headers={headers}
              onEditLead={(lead) => {
                setEditingLead(lead);
                setIsLeadModalOpen(true);
              }}
              onDeleteLead={handleDeleteLead}
              onQuickStatusChange={(lead, status) =>
                handleMoveStage(lead, status)
              }
            />
          )}

          {activeTab === 'kanban' && (
            <FunnelKanban
              leads={filteredLeads}
              onEditLead={(lead) => {
                setEditingLead(lead);
                setIsLeadModalOpen(true);
              }}
              onMoveStage={handleMoveStage}
            />
          )}

          {activeTab === 'followups' && (
            <FollowUpView
              leads={filteredLeads}
              onEditLead={(lead) => {
                setEditingLead(lead);
                setIsLeadModalOpen(true);
              }}
              onUpdateFollowUp={handleUpdateFollowUpDate}
            />
          )}

          {activeTab === 'dashboard' && (
            <AnalyticsDashboard leads={filteredLeads} />
          )}
        </div>
      </main>

      {/* Create / Edit Lead Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleSaveLead}
        initialLead={editingLead}
        headers={headers}
        nextSlNo={nextSlNo}
        onOpenAddFieldModal={() => setIsAddFieldModalOpen(true)}
      />

      {/* Add New Table Field / Column Heading Modal */}
      <AddFieldModal
        isOpen={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        onAddField={handleAddFieldColumn}
        existingHeaders={headers}
      />

      {/* Google Sheets Connection Modal */}
      <ConnectSheetModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        sheetMetadata={sheetMetadata}
        onConnectToken={async (sheetId, token) => {
          await handleSyncWithGoogle(sheetId, token);
        }}
        onSwitchToDemo={() => {
          setSheetMetadata((prev) => ({ ...prev, isDemoMode: true }));
          showToast('Switched to Demo / Offline Google Sheet mode');
        }}
        leads={leads}
        headers={headers}
        onOpenColumnMapper={() => setIsColumnMapperOpen(true)}
        autoSyncInterval={sheetMetadata.autoSyncInterval ?? 30}
        onChangeAutoSyncInterval={(sec) => {
          setSheetMetadata((prev) => ({ ...prev, autoSyncInterval: sec }));
          showToast(`Auto-sync frequency updated to ${sec === 0 ? 'Manual Only' : sec + ' seconds'}`);
        }}
      />

      {/* Dynamic Column Mapper Modal */}
      <ColumnMapperModal
        isOpen={isColumnMapperOpen}
        onClose={() => setIsColumnMapperOpen(false)}
        headers={headers}
        sheetHeaders={headers}
        currentMapping={sheetMetadata.customColumnMapping || {}}
        onSaveMapping={(newMapping) => {
          setSheetMetadata((prev) => ({ ...prev, customColumnMapping: newMapping }));
          // Re-trigger sync with new column mapping if connected
          if (oauthToken && sheetMetadata.spreadsheetId) {
            handleSyncWithGoogle(sheetMetadata.spreadsheetId, oauthToken, sheetMetadata.sheetName);
          } else {
            showToast('Custom column mapping saved successfully!');
          }
        }}
      />

      {/* Floating Glass Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181B]/90 text-zinc-100 border border-zinc-700/80 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-500 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
