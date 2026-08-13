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
import { SUPPORT_PHONE_LINK, WHATSAPP_LINK } from './config';
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
        // If redirect sign-in completed with a pending connect, handle it first
        const pendingProcessed = localStorage.getItem('pending_connect_processed');
        if (pendingProcessed) {
          try {
            const p = JSON.parse(pendingProcessed);
            if (p && p.sheetId && p.token) {
              await handleSyncWithGoogle(p.sheetId, p.token, p.selectedTab || undefined);
              localStorage.removeItem('pending_connect_processed');
              return;
            }
          } catch (e) {
            // ignore
          }
        }

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

      {/* Floating contact buttons for desktop */}
      <div className="hidden md:flex flex-col fixed right-6 bottom-6 z-50 space-y-3">
        {SUPPORT_PHONE_LINK && (
          <a href={SUPPORT_PHONE_LINK} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-lg shadow hover:bg-zinc-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12 1.21.35 2.4.68 3.54a2 2 0 0 1-.45 2.11L9.91 10.09a16 16 0 0 0 6 6l1.72-1.72a2 2 0 0 1 2.11-.45c1.14.33 2.33.56 3.54.68A2 2 0 0 1 22 16.92z"/></svg>
            <span>Call</span>
          </a>
        )}
        {WHATSAPP_LINK && (
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg shadow hover:bg-emerald-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.93 11.93 0 0 0 12.03 1C6 1 1 6 1 12a11 11 0 0 0 1.72 6.04L1 23l4.98-1.31A11.93 11.93 0 0 0 12.03 23c6.03 0 11.03-5 11.03-11 0-1.86-.43-3.62-1.54-5.22zM12 20.5c-1.85 0-3.62-.5-5.17-1.44l-.37-.22-2.96.78.79-2.92-.23-.38A8.5 8.5 0 0 1 3.5 12c0-4.69 3.81-8.5 8.53-8.5 4.69 0 8.5 3.81 8.5 8.5S16.69 20.5 12 20.5z"/></svg>
            <span>WhatsApp</span>
          </a>
        )}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-zinc-800 text-zinc-200 px-3 py-2 rounded-lg">Top</button>
      </div>

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
