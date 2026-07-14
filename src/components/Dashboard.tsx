/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transfer, Wallet } from '../types';
import { 
  ArrowRightLeft, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Download,
  Info,
  Coins
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  transfers: Transfer[];
  wallets: Wallet[];
  onFundWallet: (amount: number, currency: string) => Promise<void>;
  onTriggerStatusChange: (id: string, status: any) => Promise<void>;
}

export default function Dashboard({
  transfers,
  wallets,
  onFundWallet,
  onTriggerStatusChange,
}: DashboardProps) {
  const [fundAmount, setFundAmount] = useState('1000');
  const [funding, setFunding] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const activeUsdWallet = wallets.find(w => w.currency === 'USD');

  const handleFund = async () => {
    const val = parseFloat(fundAmount);
    if (isNaN(val) || val <= 0) {
      alert("Please specify a valid deposit amount.");
      return;
    }
    setFunding(true);
    try {
      await onFundWallet(val, 'USD');
      setFundAmount('1000');
    } catch (err: any) {
      alert(err.message || "Failed to fund wallet.");
    } finally {
      setFunding(false);
    }
  };

  const toggleExpandTx = (id: string) => {
    setSelectedTxId(selectedTxId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Delivered
          </span>
        );
      case 'processing':
        return (
          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> Processing
          </span>
        );
      case 'aml_review':
        return (
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> AML Flagged
          </span>
        );
      case 'dispatched':
        return (
          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span> Dispatched
          </span>
        );
      case 'initiated':
        return (
          <span className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span> Initiated
          </span>
        );
      default:
        return (
          <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider font-mono">
            {status}
          </span>
        );
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'initiated': return 0;
      case 'processing': return 1;
      case 'aml_review': return 1;
      case 'dispatched': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const handleDownloadReceipt = (tx: Transfer) => {
    const receiptContent = `========================================================
            REMITGUARD COMPLIANT REMITTANCE RECORD
========================================================
Reference No:   ${tx.referenceNumber}
Timestamp:      ${new Date(tx.createdAt).toLocaleString()}
Clearance:      SECURE COMPLIANT • PASS
Sender:         ${tx.senderName}
Beneficiary:    ${tx.beneficiaryName}
Payout Route:   ${tx.payoutMethod.toUpperCase()}

Sent Amount:    $${tx.sendAmount.toFixed(2)} USD
Transfer Fee:   $${tx.transferFee.toFixed(2)} USD
Exch. Rate:     1 USD = ${tx.exchangeRate.toFixed(4)} ${tx.receiveCurrency}
Delivered:      ${tx.receiveAmount.toLocaleString()} ${tx.receiveCurrency}

Current Status: ${tx.status.toUpperCase()}
Audit Risk Rating: SCORE: ${tx.riskScore}/100
========================================================
         REMITGUARD LEDGER NETWORKS • ENCRYPTED
========================================================`;
    
    const element = document.createElement("a");
    const file = new Blob([receiptContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${tx.referenceNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      
      {/* Dark Glowing Header Accent */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Sandbox Feed
          </span>
          <h2 className="text-xl font-black text-white tracking-tight uppercase mt-1">Multi-Currency Liquidity Console</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            System Node: <span className="text-emerald-400 font-bold">ONLINE</span>
          </span>
        </div>
      </div>

      {/* Full Black Wallet Card layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Wallet Balance Display - pitch black background with emerald glowing border */}
        <div className="lg:col-span-2 bg-black border-2 border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.04)] flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-widest font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-500" />
                Simulated Liquidity Ledgers
              </span>
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">USD Core Account</span>
            </div>
            
            <div>
              <span className="text-zinc-500 text-xs font-mono">Available Balance</span>
              <div className="text-4xl font-black font-mono tracking-tight text-white mt-1">
                ${activeUsdWallet?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-zinc-900 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 font-mono block">Sub-Currency Accounts (SDR Pool)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1.5">
              {wallets.slice(1).map((w) => (
                <div key={w.currency} className="bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-xl flex items-center justify-between font-mono hover:border-zinc-800 transition-colors">
                  <span className="text-[10px] text-zinc-400">{w.currency}</span>
                  <span className="text-xs font-bold text-white font-mono">{w.symbol}{w.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deposit/Funding interface - Pitch Black custom container */}
        <div className="bg-black border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div>
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Inject Sandbox Capital
            </h3>
            <p className="text-[11px] text-zinc-400 leading-normal mb-5">
              Instantly increase your simulated USD reserves to fulfill larger international transaction tests.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-zinc-500 font-bold font-mono">$</span>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500/80 rounded-xl text-xs font-bold focus:outline-none text-white font-mono transition-colors"
                min="10"
              />
            </div>
            
            <button
              onClick={handleFund}
              disabled={funding}
              className="w-full py-2.5 bg-zinc-100 hover:bg-white text-black rounded-xl text-xs font-black transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              {funding ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-zinc-900 stroke-[3px]" />
                  LOAD SIMULATED DOLLARS
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Active Corridor Pipeline Stream (Sleek List) */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
          <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
          Active Remittances & Compliance Audit
        </h3>

        {transfers.length === 0 ? (
          <div className="bg-black border border-zinc-800 rounded-2xl p-16 text-center space-y-3">
            <Clock className="w-10 h-10 text-zinc-700 mx-auto" />
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">No active transfer corridors</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Use the "Send money" interactive converter module to initiate cross-border liquidity transactions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((tx) => {
              const isExpanded = selectedTxId === tx.id;
              const stepIdx = getStepIndex(tx.status);

              return (
                <div 
                  key={tx.id} 
                  className={`bg-black border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'border-zinc-700 shadow-2xl' : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  
                  {/* Summary Bar - Trigger */}
                  <div
                    onClick={() => toggleExpandTx(tx.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none gap-4 hover:bg-zinc-950/40"
                  >
                    <div className="flex items-center gap-3">
                      {/* Initials badge in sleek obsidian colors */}
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 font-extrabold text-xs shrink-0 font-mono shadow-sm">
                        {tx.beneficiaryName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{tx.beneficiaryName}</span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono font-bold uppercase">{tx.receiveCurrency}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{tx.referenceNumber} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-white">${tx.sendAmount.toFixed(2)} USD</span>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Rate: {tx.exchangeRate.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(tx.status)}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable detailed tracker view in pure dark theme */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t border-zinc-900 bg-zinc-950/80 p-5 space-y-6"
                    >
                      
                      {/* Horizontal Step Progress Tracker */}
                      <div className="relative flex items-center justify-between max-w-xl mx-auto pt-4 pb-2">
                        {/* Track line behind */}
                        <div className="absolute left-0 right-0 h-[2px] bg-zinc-800 top-6 -z-10 rounded">
                          <div
                            className={`h-full rounded transition-all duration-500 ${
                              tx.status === 'aml_review' ? 'bg-rose-500/60' : 'bg-emerald-500'
                            }`}
                            style={{ width: tx.status === 'aml_review' ? '33%' : `${(stepIdx / 3) * 100}%` }}
                          />
                        </div>

                        {/* Tracker Steps */}
                        {[
                          { label: 'Initiated', index: 0 },
                          { label: tx.status === 'aml_review' ? 'AML Screened' : 'Cleared & Processing', index: 1 },
                          { label: 'Dispatched', index: 2 },
                          { label: 'Delivered', index: 3 },
                        ].map((pt, i) => {
                          const isCompleted = stepIdx >= pt.index && tx.status !== 'aml_review';
                          const isAmlReview = tx.status === 'aml_review' && i === 1;
                          const isCurrent = stepIdx === pt.index;

                          return (
                            <div key={i} className="flex flex-col items-center text-center relative z-10 select-none">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-extrabold font-mono transition-all ${
                                isAmlReview 
                                  ? 'bg-rose-950/80 border-rose-500 text-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                  : isCompleted 
                                    ? 'bg-emerald-500 border-emerald-500 text-black' 
                                    : isCurrent
                                      ? 'bg-zinc-900 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                              }`}>
                                {isCompleted ? '✓' : isAmlReview ? '!' : i + 1}
                              </div>
                              <span className={`text-[10px] font-bold mt-2 font-sans tracking-wide uppercase ${
                                isAmlReview 
                                  ? 'text-rose-400' 
                                  : isCompleted 
                                    ? 'text-emerald-400' 
                                    : isCurrent 
                                      ? 'text-white font-black' 
                                      : 'text-zinc-500'
                              }`}>
                                {pt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed info breakdown cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-xs pt-2">
                        
                        {/* Left Card: Receipts, Metadata */}
                        <div className="bg-black p-4 border border-zinc-900 rounded-xl space-y-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 font-mono block">Remittance Ledger Manifest</span>
                          <div className="space-y-1.5 font-mono text-[10px] text-zinc-400">
                            <div>• Recipient Target: <span className="text-white font-bold">{tx.payoutMethod.toUpperCase()}</span></div>
                            <div>• Initiated Time: {new Date(tx.createdAt).toLocaleString()}</div>
                            <div>• Est. Completion: {new Date(tx.estimatedDelivery).toLocaleDateString()}</div>
                          </div>

                          <div className="pt-3 border-t border-zinc-900 flex justify-between gap-3">
                            <button
                              onClick={() => handleDownloadReceipt(tx)}
                              className="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg transition-colors border border-zinc-800 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-zinc-400" />
                              DOWNLOAD RECEIPT
                            </button>
                            
                            {/* Admin phase forwarding controls */}
                            {tx.status !== 'completed' && tx.status !== 'aml_review' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextStatus = tx.status === 'initiated' ? 'processing' : tx.status === 'processing' ? 'dispatched' : 'completed';
                                  onTriggerStatusChange(tx.id, nextStatus);
                                }}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 font-mono uppercase tracking-wider cursor-pointer"
                                title="Forward corridor to next processing queue phase"
                              >
                                ADVANCE PHASE
                                <ArrowRightLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Right Card: Anti-Money Laundering and Screening */}
                        <div className={`p-4 border rounded-xl space-y-3 bg-black transition-colors ${
                          tx.riskScore >= 50 ? 'border-rose-900/50 bg-rose-950/5' : 'border-zinc-900'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 font-mono">Compliance Evaluation</span>
                            <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${
                              tx.riskScore >= 50 ? 'bg-rose-950 text-rose-400 border border-rose-900' : 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            }`}>
                              RISK: {tx.riskScore}/100
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px] text-zinc-400 leading-normal font-mono">
                            {tx.riskReasons?.slice(0, 2).map((reason, idx) => (
                              <div key={idx} className="flex gap-2 items-start">
                                <span className="text-emerald-500 font-bold shrink-0">•</span>
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
