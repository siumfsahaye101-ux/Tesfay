/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Wallet, KycSubmission, Transfer, CurrencyRate } from '../types';
import { 
  User, 
  ChevronDown, 
  ShieldCheck, 
  ShieldAlert,
  Wallet2, 
  ArrowRightLeft, 
  Download, 
  RotateCcw,
  UserCheck,
  Mail,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import userAvatar from '../assets/images/user_avatar_1783693186579.jpg';

interface UserDropdownProps {
  kyc: KycSubmission | null;
  wallets: Wallet[];
  transfers: Transfer[];
  rates: CurrencyRate[];
  receiveCurrency: string;
  setReceiveCurrency: (code: string) => void;
  onResetSandbox: () => Promise<void>;
  onNavigateToKyc: () => void;
}

export default function UserDropdown({
  kyc,
  wallets,
  transfers,
  rates,
  receiveCurrency,
  setReceiveCurrency,
  onResetSandbox,
  onNavigateToKyc,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeUsdWallet = wallets.find(w => w.currency === 'USD');
  const receiveOptions = rates.filter(r => r.type === 'receive');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadLedger = () => {
    const header = `===========================================================
               REMITGUARD COMPREHENSIVE REMITTANCE LEDGER
===========================================================
Client Name:      Sium Sahaye
Email Address:    siumfsahaye101@gmail.com
Residency:        United States of America
Document File:    Verified ID Portfolio
Generated At:     ${new Date().toLocaleString()}
-----------------------------------------------------------
`;

    const walletLines = `MULTICURRENCY WALLET BALANCE SUMMARY:
${wallets.map(w => `• ${w.currency}: ${w.symbol}${w.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n')}
-----------------------------------------------------------
`;

    const txHeader = `COMPLETED AND ACTIVE REMITTANCES LEDGER:\n`;
    const txLines = transfers.length === 0 
      ? `No transactions recorded in this session.\n`
      : transfers.map((tx, idx) => {
          return `${idx + 1}. [${new Date(tx.createdAt).toLocaleDateString()}] ${tx.referenceNumber}
   Sender: ${tx.senderName} (${tx.sendCurrency}) -> Recipient: ${tx.beneficiaryName} (${tx.receiveCurrency})
   Sent: $${tx.sendAmount.toFixed(2)} USD | Payout: ${tx.receiveAmount.toLocaleString()} ${tx.receiveCurrency}
   Status: ${tx.status.toUpperCase()} | Risk Screening Score: ${tx.riskScore}/100\n`;
        }).join('\n');

    const footer = `===========================================================
       REMITGUARD SECURITY ASSURED • AML/CTF CLEARANCE LEVEL
===========================================================`;

    const ledgerContent = header + walletLines + txHeader + txLines + footer;

    const element = document.createElement("a");
    const file = new Blob([ledgerContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `remitguard-ledger-statement.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clickable Header Logo/Avatar Trigger */}
      <button
        id="user-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer select-none"
      >
        <div className="relative">
          <img
            src={userAvatar}
            alt="Sium Sahaye"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
            onError={(e) => {
              // Fallback if import is somehow skipped or errors
              (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/sium/150/150';
            }}
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-800">Sium Sahaye</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
          </div>
          <p className="text-[10px] font-medium text-slate-400">Verified Remitter</p>
        </div>
      </button>

      {/* Interactive Floating Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden text-slate-800 select-none"
          >
            {/* User Profile Header */}
            <div className="p-4 bg-gradient-to-tr from-slate-950 to-slate-900 text-white flex items-center gap-3">
              <img
                src={userAvatar}
                alt="Sium Sahaye"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/30"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/sium/150/150';
                }}
              />
              <div>
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-extrabold tracking-wide uppercase">Sium Sahaye</h4>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 shrink-0" />
                  siumfsahaye101@gmail.com
                </p>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0 text-rose-400" />
                  San Francisco, United States
                </p>
              </div>
            </div>

            {/* KYC Clearance Status Row */}
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">KYC Compliance</span>
              {kyc && kyc.status === 'approved' ? (
                <button 
                  onClick={() => { onNavigateToKyc(); setIsOpen(false); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Approved Limit
                </button>
              ) : kyc && kyc.status === 'pending' ? (
                <button 
                  onClick={() => { onNavigateToKyc(); setIsOpen(false); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full animate-pulse"
                >
                  Pending Audit
                </button>
              ) : (
                <button
                  onClick={() => { onNavigateToKyc(); setIsOpen(false); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full hover:bg-rose-100 transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Action Required
                </button>
              )}
            </div>

            {/* Mini Wallets List */}
            <div className="p-4 space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <Wallet2 className="w-3.5 h-3.5" />
                  Ledger Assets Summary
                </span>
                <span className="font-mono text-slate-500 text-[9px]">SDR Equivalent</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {wallets.map(w => (
                  <div key={w.currency} className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-800 block">
                      {w.symbol}{w.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">{w.currency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Corridor Quick-Switcher dropdown selection */}
            <div className="px-4 pb-4 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Active Corridor Switcher
              </span>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <div className="w-1/3 bg-slate-100 border-r border-slate-200 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 select-none">
                  🇺🇸 USD
                </div>
                <div className="flex-1 flex items-center px-2">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <select
                    value={receiveCurrency}
                    onChange={(e) => {
                      setReceiveCurrency(e.target.value);
                    }}
                    className="w-full bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer py-1.5"
                  >
                    {receiveOptions.map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.flag} {opt.code} - {opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Down to use features: Download & Reset Sandbox */}
            <div className="border-t border-slate-100 p-2 bg-slate-50 flex flex-col gap-1">
              <button
                onClick={handleDownloadLedger}
                className="w-full flex items-center justify-between text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  Download Remit Ledger
                </span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded font-bold uppercase">TXT</span>
              </button>

              <button
                onClick={async () => {
                  if (confirm("Reset current sandbox ledger balances and logs?")) {
                    await onResetSandbox();
                    setIsOpen(false);
                  }
                }}
                className="w-full flex items-center justify-between text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  Reset Sandbox Data
                </span>
                <span className="text-[9px] font-mono text-rose-400 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-bold uppercase">System</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
