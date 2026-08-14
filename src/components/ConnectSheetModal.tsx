import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  ExternalLink,
  Key,
  Download,
  CheckCircle,
  FileSpreadsheet,
  RefreshCw,
  Info,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { Lead, SheetMetadata } from '../types';
import {
  createSampleSpreadsheet,
  extractSpreadsheetId,
  listDriveSpreadsheets,
  fetchSheetPreview,
} from '../services/googleSheets';
import { googleSignIn, getAccessToken, verifyAndSetAccessToken, getGoogleUser, clearGoogleAuthState, assertGoogleAccountOwnership, auth } from '../services/googleAuth';

interface ConnectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetMetadata: SheetMetadata;
  onConnectToken: (spreadsheetId: string, accessToken: string, selectedTab?: string) => Promise<void>;
  onSwitchToDemo: () => void;
  leads: Lead[];
  headers: string[];
  onOpenColumnMapper?: () => void;
  autoSyncInterval?: number;
  onChangeAutoSyncInterval?: (intervalSeconds: number) => void;
}

export const ConnectSheetModal: React.FC<ConnectSheetModalProps> = ({
  isOpen,
  onClose,
  sheetMetadata,
  onConnectToken,
  onSwitchToDemo,
  leads,
  headers,
  onOpenColumnMapper,
  autoSyncInterval = 30,
  onChangeAutoSyncInterval,
}) => {
  const [sheetId, setSheetId] = useState(
    sheetMetadata.spreadsheetId || ''
  );
  const [selectedTab, setSelectedTab] = useState(sheetMetadata.sheetName || 'Sheet1');
  const [tokenInput, setTokenInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingSample, setIsCreatingSample] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isBrowsingDrive, setIsBrowsingDrive] = useState(false);
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string }>>([]);
  const [driveQuery, setDriveQuery] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any | null>(null);
  const [isLoadingTokenInfo, setIsLoadingTokenInfo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSheetId(sheetMetadata.spreadsheetId || '');
      setSelectedTab(sheetMetadata.sheetName || 'Sheet1');
      // Clear any previously loaded Drive files when opening modal
      setDriveFiles([]);
      const cached = getAccessToken();
      if (cached && !tokenInput) {
        setTokenInput(cached);
      }
    }
  }, [isOpen, sheetMetadata.spreadsheetId, sheetMetadata.sheetName]);

  if (!isOpen) return null;

  const handleGoogleSignInAndSync = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const cleanId = extractSpreadsheetId(sheetId || '');
      // Save pending connect request to localStorage so it can be completed after redirect
      try {
        // Include firebaseUid so pending connects are user-scoped and cannot be replayed across accounts
        const firebaseUid = auth.currentUser?.uid || null;
        localStorage.setItem('pending_connect', JSON.stringify({ firebaseUid, sheetId: cleanId, selectedTab }));
      } catch (e) {}
      // Trigger redirect sign-in flow; the app will process pending_connect after redirect
      await googleSignIn();
      // signInWithRedirect will navigate away; if it returns, inform the user
      setSuccessMsg('Redirecting to Google for sign-in...');
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          'Google Sign-In failed. Please ensure popups are allowed or paste token manually.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleShowTokenInfo = async () => {
    setIsLoadingTokenInfo(true);
    setTokenInfo(null);
    setErrorMsg('');
    try {
      let token = tokenInput.trim() || getAccessToken();
      if (tokenInput.trim() && !getAccessToken()) {
        // If user pasted a token, attempt to verify and bind it for this session
        try {
          await verifyAndSetAccessToken(tokenInput.trim());
          token = tokenInput.trim();
          setTokenInput(token);
        } catch (err: any) {
          throw err;
        }
      }
      if (!token) throw new Error('No access token available. Please sign in.');
      const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`);
      const data = await res.json();
      setTokenInfo({ status: res.status, body: data });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch token info');
    } finally {
      setIsLoadingTokenInfo(false);
    }
  };

  const handleBrowseDrive = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsBrowsingDrive(true);
    try {
      let token = tokenInput.trim() || getAccessToken();
      if (tokenInput.trim() && !getAccessToken()) {
        // Verify manual token before using it
        try {
          await verifyAndSetAccessToken(tokenInput.trim());
          token = tokenInput.trim();
          setTokenInput(token);
        } catch (err: any) {
          setErrorMsg(err.message || 'Token verification failed');
          return;
        }
      }
      if (!token) throw new Error('Please sign in with Google first to browse Drive');
      // As a final safety check, assert the token is bound to current Firebase user
      try {
        await assertGoogleAccountOwnership();
      } catch (e) {
        throw new Error('Google account ownership verification failed for Drive browse');
      }
      const files = await listDriveSpreadsheets(token, 50, '');
      setDriveFiles(files);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to list Drive files');
    } finally {
      setIsBrowsingDrive(false);
    }
  };

  const handleDriveSelect = async (fileId: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    let token = tokenInput.trim() || getAccessToken();
    if (tokenInput.trim() && !getAccessToken()) {
      try {
        await verifyAndSetAccessToken(tokenInput.trim());
        token = tokenInput.trim();
        setTokenInput(token);
      } catch (err: any) {
        setErrorMsg(err.message || 'Token verification failed');
        return;
      }
    }
    if (!token) {
      setErrorMsg('Please sign in with Google first');
      return;
    }
    try {
      await assertGoogleAccountOwnership();
    } catch (e) {
      setErrorMsg('Google account ownership verification failed');
      return;
    }
    try {
      await onConnectToken(fileId, token, selectedTab);
      setSuccessMsg('Connected to selected spreadsheet');
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to selected spreadsheet');
    }
  };

  const handleCreateNewSheet = async () => {
    setIsCreatingSample(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let token = tokenInput.trim() || getAccessToken();
      if (tokenInput.trim() && !getAccessToken()) {
        try {
          await verifyAndSetAccessToken(tokenInput.trim());
          token = tokenInput.trim();
          setTokenInput(token);
        } catch (err: any) {
          throw err;
        }
      }
      if (!token) {
        const authRes = await googleSignIn();
        const verified = getAccessToken();
        if (verified) {
          token = verified;
          setTokenInput(token);
        } else {
          throw new Error('Please sign in with Google first to create a spreadsheet.');
        }
      }
      // Verify ownership before creating a sheet
      try {
        await assertGoogleAccountOwnership();
      } catch (e) {
        throw new Error('Google account ownership verification failed. Please reconnect.');
      }
      const newSheet = await createSampleSpreadsheet(token, 'SalesFlow Pro Leads');
      setSheetId(newSheet.spreadsheetId);
      await onConnectToken(newSheet.spreadsheetId, token);
      setSuccessMsg(`Created new Google Sheet "${newSheet.title}" and synced!`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create sample Google Sheet.');
    } finally {
      setIsCreatingSample(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() && !getAccessToken()) {
      setErrorMsg('Please click "Sign in with Google" or paste your OAuth token');
      return;
    }
    setIsConnecting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let token = tokenInput.trim() || getAccessToken() || '';
      if (tokenInput.trim() && !getAccessToken()) {
        await verifyAndSetAccessToken(tokenInput.trim());
        token = tokenInput.trim();
        setTokenInput(token);
      }
      try {
        await assertGoogleAccountOwnership();
      } catch (e) {
        throw new Error('Google account ownership verification failed. Please reconnect.');
      }
      const cleanId = extractSpreadsheetId(sheetId.trim());
      await onConnectToken(cleanId, token, selectedTab);
      setSuccessMsg('Successfully connected and synced with Google Sheet!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect to Google Sheet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const csvRows: string[] = [];
    csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

    for (const lead of leads) {
      const rowVals = headers.map((header, idx) => {
        let val = '';
        switch (idx) {
          case 0:
            val = lead.slNo;
            break;
          case 1:
            val = lead.date;
            break;
          case 2:
            val = lead.name;
            break;
          case 3:
            val = lead.contact;
            break;
          case 4:
            val = lead.place;
            break;
          case 5:
            val = lead.requirement;
            break;
          case 6:
            val = lead.platform;
            break;
          case 7:
            val = lead.reference;
            break;
          case 8:
            val = lead.category;
            break;
          case 9:
            val = lead.followUpDate;
            break;
          case 10:
            val = lead.status;
            break;
          case 11:
            val = lead.status2;
            break;
          default:
            val = lead.customFields[header] || '';
            break;
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(rowVals.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SalesFlow_Leads_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="premium-modal rounded-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Google Sheet Integration
              </h3>
              <p className="text-xs text-zinc-400">
                Live 2-way sync with your Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm">
          {/* Token info debug */}
          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">Access Token Info</span>
                <span className="text-[11px] text-zinc-400">Debug token scopes and expiry</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleShowTokenInfo} disabled={isLoadingTokenInfo} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded">Check token</button>
              </div>
            </div>
            {tokenInfo ? (
              <div className="text-xs text-zinc-300 bg-black/40 p-2 rounded">
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(tokenInfo, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">No token info loaded.</div>
            )}
          </div>
          {/* Drive Browser */}
          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">Browse Google Drive</span>
                <span className="text-[11px] text-zinc-400">Select a spreadsheet from your Drive</span>
              </div>
              <button
                onClick={handleBrowseDrive}
                disabled={isBrowsingDrive}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded"
              >
                {isBrowsingDrive ? 'Loading...' : 'Browse'}
              </button>
            </div>

            {driveFiles.length > 0 ? (
              <div className="max-h-36 overflow-auto text-xs space-y-2">
                {driveFiles.map((f) => (
                  <div key={f.id} className="flex items-center justify-between bg-black/40 px-3 py-2 rounded">
                    <div className="truncate">{f.name}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSheetId(f.id); }} className="text-xs text-zinc-400 hover:text-white">Use ID</button>
                      <button onClick={() => handleDriveSelect(f.id)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded">Connect</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500">No files loaded yet. Click Browse to load spreadsheets from your Drive.</div>
            )}
          </div>
          {/* Target Spreadsheet Box & Tab Selector */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300 uppercase tracking-wider">
                Google Sheet URL or ID
              </span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${extractSpreadsheetId(
                  sheetId
                )}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center font-medium"
              >
                <span>Open Spreadsheet</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <input
              type="text"
              value={sheetId}
              onChange={(e) => {
                setSheetId(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Paste Google Spreadsheet URL or ID..."
              className="w-full bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
            />

            {/* Tab Selector if available */}
            {sheetMetadata.availableSheets && sheetMetadata.availableSheets.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Sheet Tab:</span>
                <select
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(e.target.value)}
                  className="bg-black/60 border border-zinc-700 rounded-md px-2.5 py-1 text-xs text-zinc-200 font-medium focus:outline-none focus:border-blue-500"
                >
                  {sheetMetadata.availableSheets.map((s) => (
                    <option key={s} value={s} className="bg-zinc-900 text-zinc-200">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Column Mapper & Auto-Sync Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-200 block mb-0.5">
                  Column Field Mapping
                </span>
                <span className="text-[11px] text-zinc-400 block mb-2">
                  Map Sheet column headers to CRM lead properties
                </span>
              </div>
              {onOpenColumnMapper && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenColumnMapper();
                    onClose();
                  }}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Configure Field Mapping ({headers.length} Cols)</span>
                </button>
              )}
            </div>

            {/* Preview controls */}
            <div className="pt-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setPreviewError(null);
                    setPreviewData(null);
                    setIsPreviewing(true);
                    try {
                      let token = tokenInput.trim() || getAccessToken();
                      if (tokenInput.trim() && !getAccessToken()) {
                        await verifyAndSetAccessToken(tokenInput.trim());
                        token = tokenInput.trim();
                        setTokenInput(token);
                      }
                      if (!token) throw new Error('Please sign in with Google to preview this sheet');
                      await assertGoogleAccountOwnership();
                      const preview = await fetchSheetPreview(extractSpreadsheetId(sheetId.trim()), selectedTab, token);
                      setPreviewData(preview);
                    } catch (err: any) {
                      setPreviewError(err.message || 'Failed to preview sheet');
                    } finally {
                      setIsPreviewing(false);
                    }
                  }}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded"
                >
                  {isPreviewing ? 'Previewing...' : 'Preview & Map'}
                </button>

                <button
                  onClick={() => {
                    // Open full column mapper if caller provided
                    if (onOpenColumnMapper) {
                      onOpenColumnMapper();
                      onClose();
                    }
                  }}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-2 py-1 rounded"
                >
                  Review Mapping
                </button>
              </div>

              {previewError && <div className="mt-2 text-xs text-red-400">{previewError}</div>}

              {previewData && (
                <div className="mt-3 bg-black/40 border border-zinc-800 rounded p-3 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-zinc-200">Preview: {previewData.title} — {previewData.sheetName}</div>
                      <div className="text-zinc-400 text-[11px]">Detected header row: Row {previewData.headerRowIdx + 1} (confidence {Math.round(previewData.headerConfidence * 100)}%)</div>
                    </div>
                    <div>
                      <button
                        onClick={() => setPreviewData(null)}
                        className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto max-h-44">
                    <table className="w-full text-left text-[12px] border-collapse">
                      <thead>
                        <tr>
                          {previewData.headers.map((h: string, i: number) => (
                            <th key={i} className="px-2 py-1 border-b border-zinc-800 text-zinc-300">{h || '(empty)'}</th>
                          ))}
                        </tr>
                        <tr>
                          {previewData.headers.map((h: string, i: number) => (
                            <th key={i} className="px-2 py-1 border-b border-zinc-800 text-zinc-400 font-mono text-xs">{previewData.mappingSuggestions[h]?.suggestedKey || 'custom'} ({Math.round((previewData.mappingSuggestions[h]?.confidence||0)*100)}%)</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.sample.slice(0,5).map((row: string[], ri: number) => (
                          <tr key={ri} className="align-top">
                            {previewData.headers.map((_: string, ci: number) => (
                              <td key={ci} className="px-2 py-1 align-top text-zinc-300">{(row[ci] || '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center justify-end space-x-2">
                    <button
                      onClick={async () => {
                        // build custom mapping from suggestions and call connect
                        const mapping: Record<string,string> = {};
                        for (const h of previewData.headers) {
                          const s = previewData.mappingSuggestions[h];
                          if (s && s.suggestedKey && s.confidence > 0.2) mapping[h] = s.suggestedKey;
                        }
                        let token = tokenInput.trim() || getAccessToken();
                        if (tokenInput.trim() && !getAccessToken()) {
                          try {
                            await verifyAndSetAccessToken(tokenInput.trim());
                            token = tokenInput.trim();
                            setTokenInput(token);
                          } catch (err: any) {
                            setPreviewError(err.message || 'Token verification failed');
                            return;
                          }
                        }
                        if (!token) { setPreviewError('Please sign in with Google first'); return; }
                        try {
                          await assertGoogleAccountOwnership();
                        } catch (e) {
                          setPreviewError('Google account ownership verification failed');
                          return;
                        }
                        try {
                          await onConnectToken(extractSpreadsheetId(sheetId.trim()), token, selectedTab, mapping);
                          setPreviewData(null);
                          onClose();
                        } catch (err: any) {
                          setPreviewError(err.message || 'Failed to connect with mapping');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs"
                    >
                      Import & Connect
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenColumnMapper) {
                          onOpenColumnMapper();
                          onClose();
                        }
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-3 py-1.5 rounded text-xs"
                    >
                      Configure Mapping
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-200 block mb-0.5">
                  Background Auto-Sync
                </span>
                <span className="text-[11px] text-zinc-400 block mb-2">
                  Periodically poll Google Sheets for team updates
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={autoSyncInterval}
                  onChange={(e) => onChangeAutoSyncInterval && onChangeAutoSyncInterval(Number(e.target.value))}
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value={30} className="bg-zinc-900">Auto Sync Every 30 Seconds</option>
                  <option value={60} className="bg-zinc-900">Auto Sync Every 60 Seconds</option>
                  <option value={0} className="bg-zinc-900">Manual Sync Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* 1-Click Google Sign-in */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">
                  1-Click Authentication (Google & Workspace)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Connect any personal or Google Workspace account to sync leads
                </span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                <span>Workspace Ready</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleGoogleSignInAndSync}
                disabled={isConnecting || isCreatingSample}
                className="bg-white hover:bg-zinc-100 text-zinc-900 px-4 py-2 rounded-lg text-xs font-bold shadow transition-all flex items-center space-x-2 disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isConnecting ? 'Signing in & Syncing...' : 'Sign in with Google & Sync'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={isConnecting || isCreatingSample}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow transition-all flex items-center space-x-1.5 disabled:opacity-60"
              >
                {isCreatingSample ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Sheet...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create & Connect New Sheet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Manual Token Option */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Or Paste Google OAuth Access Token Manually
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  placeholder="ya29.a0AfB_by... (optional if signed in above)"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs font-mono"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg flex items-start space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg flex items-center">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  onSwitchToDemo();
                  onClose();
                }}
                className="text-xs text-zinc-400 hover:text-white underline font-medium"
              >
                Use Offline / Demo Mode (No token needed)
              </button>

              <button
                type="submit"
                disabled={isConnecting || isCreatingSample}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 mr-1.5" />
                    <span>Connect & Sync</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Export section */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-300 block">
                Export Spreadsheet Data
              </span>
              <span className="text-[11px] text-zinc-500">
                Download all {leads.length} leads as CSV for Excel / Sheets
              </span>
            </div>
            <button
              onClick={handleExportCSV}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export .CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
