/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Send, 
  LayoutDashboard, 
  ShieldCheck, 
  Terminal, 
  MessageSquareCode,
  Sparkles,
  Wallet,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'send' | 'dashboard' | 'kyc' | 'admin';
  setActiveTab: (tab: 'send' | 'dashboard' | 'kyc' | 'admin') => void;
  walletBalance: { currency: string; balance: number; symbol: string }[];
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  apiStatus: { ok: boolean; hasApiKey: boolean; loading: boolean };
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  walletBalance,
  isChatOpen,
  setIsChatOpen,
  apiStatus,
}: SidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-full text-slate-100 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-900 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-900/20">
          <Send className="w-5 h-5 -rotate-45 font-extrabold fill-slate-950" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            RemitGuard
          </h1>
          <p className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider flex items-center gap-1 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Fintech Production
          </p>
        </div>
      </div>

      {/* Wallet Summary */}
      <div className="p-4 mx-3 my-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">
          <span className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
            Active Remit Wallet
          </span>
          <span className="text-emerald-400 text-[10px]">USD</span>
        </div>
        {walletBalance.length > 0 ? (
          <div>
            <span className="text-xl font-bold font-mono tracking-tight text-white">
              {walletBalance[0].symbol}{walletBalance[0].balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex gap-2.5 mt-2 pt-2 border-t border-slate-800/50 text-[11px] text-slate-400">
              {walletBalance.slice(1).map((w) => (
                <span key={w.currency} className="font-mono bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-800">
                  {w.symbol}{w.balance.toFixed(2)} {w.currency}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">No wallets found</span>
        )}
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 px-3 space-y-1 select-none">
        <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Remittance Client
        </div>

        <button
          onClick={() => setActiveTab('send')}
          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'send'
              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-2 border-emerald-400'
              : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4 -rotate-45 shrink-0" />
          Send Money Online
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-2 border-emerald-400'
              : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Tracker & Activities
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'kyc'
              ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-400 border-l-2 border-emerald-400'
              : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Identity (KYC Desk)
        </button>

        <div className="pt-4 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Compliance Desk
        </div>

        <button
          onClick={() => setActiveTab('admin')}
          className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'admin'
              ? 'bg-gradient-to-r from-rose-500/10 to-pink-500/5 text-rose-400 border-l-2 border-rose-500'
              : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4 shrink-0 text-rose-400/80" />
          AML Admin Control
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-semibold transition-all mt-4 border border-slate-800/80 ${
            isChatOpen 
              ? 'bg-indigo-950/40 text-indigo-300' 
              : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-3">
            <MessageSquareCode className="w-4 h-4 text-indigo-400" />
            AI Support Assistant
          </span>
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
        </button>
      </div>

      {/* Live Node status */}
      <div className="p-4 border-t border-slate-900/80 bg-slate-950/80 flex flex-col gap-1.5 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Compliance Core</span>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold bg-slate-900 border border-slate-800 px-1 py-0.5 rounded">
            TLS v1.3
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] mt-1 text-slate-400">
          <span>Gemini-3.5-Flash</span>
          {apiStatus.loading ? (
            <span className="text-amber-500 font-medium">Checking</span>
          ) : apiStatus.hasApiKey ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
            </span>
          ) : (
            <span className="text-amber-500 font-semibold">Demo Sandbox</span>
          )}
        </div>
      </div>
    </aside>
  );
}
