/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transfer, AuditLog } from '../types';
import { 
  ShieldAlert, 
  Terminal, 
  UserCheck, 
  FileCheck2, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Layers,
  LineChart
} from 'lucide-react';

interface AdminTerminalProps {
  transfers: Transfer[];
  onTriggerStatusChange: (id: string, status: any) => Promise<void>;
  auditLogs: AuditLog[];
  onFetchAuditLogs: () => void;
}

export default function AdminTerminal({
  transfers,
  onTriggerStatusChange,
  auditLogs,
  onFetchAuditLogs,
}: AdminTerminalProps) {
  // AML screenings simulator search state
  const [amlSearchName, setAmlSearchName] = useState('Vladimir Putin');
  const [amlSearchCountry, setAmlSearchCountry] = useState('Russia');
  const [amlScreenLoading, setAmlScreenLoading] = useState(false);
  const [amlScreenResult, setAmlScreenResult] = useState<any>(null);

  const flaggedTransfers = transfers.filter(t => t.status === 'aml_review');

  const triggerAmlDecision = async (id: string, decision: 'approve' | 'reject') => {
    try {
      const nextStatus = decision === 'approve' ? 'processing' : 'cancelled';
      await onTriggerStatusChange(id, nextStatus);
    } catch (err: any) {
      alert("Failed to record compliance decision: " + err.message);
    }
  };

  const executeAmlCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amlSearchName.trim()) return;

    setAmlScreenLoading(true);
    setAmlScreenResult(null);
    try {
      const res = await fetch('/api/compliance/aml-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: amlSearchName, country: amlSearchCountry })
      });
      const data = await res.json();
      setAmlScreenResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAmlScreenLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 select-none">
        <Terminal className="w-6 h-6 text-rose-600" />
        <div>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">Compliance Officer Admin Command Center</h2>
          <p className="text-xs text-slate-500">Perform AML screening, override transaction holds, and review system-wide tamper-proof audit trails.</p>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Flagged transactions pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
              Flagged Transaction Hold Queue ({flaggedTransfers.length})
            </h3>

            {flaggedTransfers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 italic">No transfers currently held under AML review. System is clear.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                {flaggedTransfers.map((tx) => (
                  <div key={tx.id} className="p-4 rounded-xl border border-rose-100 bg-rose-50/10 space-y-3">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{tx.senderName} ➜ {tx.beneficiaryName}</span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.referenceNumber} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-slate-900">${tx.sendAmount.toFixed(2)} USD</span>
                        <span className="block text-[9px] text-rose-600 font-bold uppercase mt-0.5">Risk Score: {tx.riskScore}/100</span>
                      </div>
                    </div>

                    <div className="bg-white border border-rose-100 rounded-lg p-2.5 text-[11px] text-slate-600 leading-relaxed font-mono">
                      <span className="font-bold text-rose-800 block uppercase text-[10px] mb-1">Triggering Audit Reasons:</span>
                      {tx.riskReasons?.map((reason, i) => (
                        <div key={i}>• {reason}</div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => triggerAmlDecision(tx.id, 'reject')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject & Freeze Funds
                      </button>
                      <button
                        onClick={() => triggerAmlDecision(tx.id, 'approve')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Override Hold & Release
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Logs Block */}
          <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-900 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Security & Compliance System Audit Logs
              </h3>
              <button onClick={onFetchAuditLogs} className="p-1 hover:bg-slate-900 rounded transition-colors" title="Reload logs">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 font-mono text-[10.5px]">
              {auditLogs.length === 0 ? (
                <div className="text-slate-500 italic py-4 text-center">No logs recorded.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 leading-relaxed items-start border-b border-slate-900/45 pb-1.5">
                    <span className="text-slate-500 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`font-bold shrink-0 ${
                      log.severity === 'critical' ? 'text-rose-400' : log.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-slate-300">{log.details}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Real-time Sanctions Search Box */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              <Search className="w-4.5 h-4.5 text-indigo-500" />
              OFAC / PEP Sanction Screen Sandbox
            </h3>
            <p className="text-[10px] text-slate-400 leading-normal">Simulate the backend sanctions check by entering target names. AI screens the name against international enforcement catalogs.</p>

            <form onSubmit={executeAmlCheck} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Target Individual Name</label>
                <input
                  type="text"
                  value={amlSearchName}
                  onChange={(e) => setAmlSearchName(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-indigo-500 text-slate-800"
                  placeholder="e.g. Vladimir Putin, Kim Jong Un"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Domicile Country</label>
                <input
                  type="text"
                  value={amlSearchCountry}
                  onChange={(e) => setAmlSearchCountry(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-indigo-500 text-slate-800"
                  placeholder="e.g. Russia, Iran"
                />
              </div>

              <button
                type="submit"
                disabled={amlScreenLoading}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {amlScreenLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Querying registers...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Execute Sanctions Screen
                  </>
                )}
              </button>
            </form>

            {/* Screening results visualization */}
            {amlScreenResult && (
              <div className={`p-4 rounded-xl border font-mono text-xs ${
                amlScreenResult.isSanctioned 
                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                  : 'bg-emerald-50/20 border-emerald-100 text-emerald-900'
              }`}>
                <div className="flex justify-between items-center font-bold">
                  <span>SCREEN STATUS:</span>
                  <span className={amlScreenResult.isSanctioned ? 'text-rose-600' : 'text-emerald-600'}>
                    {amlScreenResult.isSanctioned ? '⚠ CRITICAL HIT' : '✓ CLEAR'}
                  </span>
                </div>
                <div className="mt-2 text-[11px] leading-relaxed text-slate-700">
                  <div className="font-bold">Recommendation: <span className="text-slate-900">{amlScreenResult.recommendation}</span></div>
                  <div className="mt-1">{amlScreenResult.details}</div>
                </div>
              </div>
            )}
          </div>

          {/* KPI Mini Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <LineChart className="w-4 h-4 text-emerald-500" />
              Compliance Clearance Rate
            </span>
            <div className="flex items-end gap-1.5 justify-between h-20 pt-4">
              {[89, 91, 94, 95, 99].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-sm transition-all"
                    style={{ height: `${val * 0.55}px` }}
                    title={`Clearance Rate: ${val}%`}
                  />
                  <span className="text-[9px] font-mono font-semibold text-slate-400 uppercase">Q{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
