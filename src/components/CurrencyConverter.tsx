/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CurrencyRate } from '../types';
import { ArrowUpDown, HelpCircle, Lock, TrendingUp, Info, Zap, ChevronDown, Search, Globe } from 'lucide-react';

interface CurrencyConverterProps {
  rates: CurrencyRate[];
  sendAmount: number;
  setSendAmount: (amount: number) => void;
  sendCurrency: string;
  setSendCurrency: (code: string) => void;
  receiveCurrency: string;
  setReceiveCurrency: (code: string) => void;
  fee: number;
  totalPayable: number;
  receiveAmount: number;
  rateLockTimer: number;
}

export default function CurrencyConverter({
  rates,
  sendAmount,
  setSendAmount,
  sendCurrency,
  setSendCurrency,
  receiveCurrency,
  setReceiveCurrency,
  fee,
  totalPayable,
  receiveAmount,
  rateLockTimer,
}: CurrencyConverterProps) {
  const [ratePrediction, setRatePrediction] = useState<{ day: string; rate: number; action: string }[]>([]);
  const [aiInsights, setAiInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendOptions = rates.filter((r) => r.type === 'send' || r.type === 'both');
  const receiveOptions = rates.filter((r) => r.type === 'receive');

  const activeSendRate = rates.find((r) => r.code === sendCurrency);
  const activeRecRate = rates.find((r) => r.code === receiveCurrency);

  const rawRate = (activeRecRate?.rateVsUsd || 1) / (activeSendRate?.rateVsUsd || 1);

  // Fetch AI-driven forex tips & 5-day predictions
  useEffect(() => {
    async function loadForexInsights() {
      setLoadingInsights(true);
      try {
        const res = await fetch('/api/ai/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.predictions) {
          // Adjust prediction rates dynamically to match the current selected currency
          const multiplier = rawRate / 83.45; // calibrate from baseline India rate
          const calibrated = data.predictions.map((p: any) => ({
            ...p,
            rate: parseFloat((p.rate * multiplier).toFixed(2)),
          }));
          setRatePrediction(calibrated);
        }
        if (data.insights) {
          setAiInsights(data.insights);
        }
      } catch (err) {
        console.error('Forex predictions loading failed', err);
      } finally {
        setLoadingInsights(false);
      }
    }
    loadForexInsights();
  }, [receiveCurrency, sendCurrency]);

  // Generate synthetic points for SVG visual graph based on currency conversion
  const svgPoints = ratePrediction.map((p, idx) => {
    const x = 30 + idx * 75;
    // Map rates to vertical coordinates inside 120px height viewBox
    const ratesArray = ratePrediction.map((r) => r.rate);
    const minRate = Math.min(...ratesArray) * 0.998;
    const maxRate = Math.max(...ratesArray) * 1.002;
    const y = maxRate === minRate ? 60 : 100 - ((p.rate - minRate) / (maxRate - minRate)) * 70;
    return { x, y, day: p.day, rate: p.rate };
  });

  const dPath = svgPoints.length > 0
    ? `M ${svgPoints[0].x} ${svgPoints[0].y} ` + svgPoints.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div id="calculator-card" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-full">
      {/* Rate Lock Bar */}
      <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <Lock className="w-3.5 h-3.5 fill-emerald-500/20" />
          Live Exchange Rate Locked
        </span>
        <span className="font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700/80">
          Expires in: <span className="font-bold text-white">{Math.floor(rateLockTimer / 60)}:{(rateLockTimer % 60).toString().padStart(2, '0')}</span>
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
        <div>
          {/* Sending Amount Box */}
          <div className="space-y-1.5 relative">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">You Send</label>
            <div className="flex rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all overflow-hidden bg-slate-50">
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSendAmount(isNaN(val) ? 0 : val);
                }}
                className="flex-1 px-4 py-3 bg-white text-lg font-bold font-mono text-slate-900 focus:outline-none focus:bg-white"
                min="10"
                max="10000"
              />
              <div className="flex items-center px-4 bg-slate-50 border-l border-slate-100 select-none shrink-0 gap-2">
                <span className="text-xl font-bold">{activeSendRate?.flag}</span>
                <select
                  value={sendCurrency}
                  onChange={(e) => setSendCurrency(e.target.value)}
                  className="bg-transparent font-bold text-sm text-slate-800 focus:outline-none cursor-pointer"
                >
                  {sendOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.code}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Intermediary Breakdown */}
          <div className="my-4 pl-4 border-l-2 border-dashed border-slate-200/80 space-y-3 py-1 relative select-none">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                Transfer Fee
                <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Flat fee for premium payout speed." />
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {fee === 0 ? 'FREE (Promo)' : `$${fee.toFixed(2)} USD`}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                Locked FX Rate
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </span>
              <span className="font-mono font-bold text-emerald-600">
                1 {sendCurrency} = {rawRate.toFixed(4)} {receiveCurrency}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Payable</span>
              <span className="font-mono font-bold text-slate-800">
                ${totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })} {sendCurrency}
              </span>
            </div>
          </div>

          {/* Receiving Amount Box */}
          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center select-none">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Recipient Receives</label>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 font-sans">
                <Globe className="w-3 h-3 text-emerald-500" /> 200+ Countries Covered
              </span>
            </div>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden relative">
              <div className="flex-1 px-4 py-3 text-lg font-extrabold font-mono text-emerald-700 bg-emerald-50/30">
                {receiveAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center px-4 bg-slate-50 border-l border-slate-100 select-none shrink-0 relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="target-country-custom-dropdown"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 bg-transparent font-bold text-sm text-slate-800 focus:outline-none cursor-pointer select-none"
                >
                  <span className="text-xl">{activeRecRate?.flag}</span>
                  <span>{activeRecRate?.code}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500 transition-transform duration-150" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-2 text-left">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search 200+ countries & currencies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar text-xs">
                      {receiveOptions
                        .filter(opt => {
                          const query = searchQuery.toLowerCase();
                          return (
                            opt.code.toLowerCase().includes(query) ||
                            opt.name.toLowerCase().includes(query) ||
                            (opt.country && opt.country.toLowerCase().includes(query))
                          );
                        })
                        .map(opt => (
                          <button
                            key={opt.code}
                            type="button"
                            onClick={() => {
                              setReceiveCurrency(opt.code);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors ${opt.code === receiveCurrency ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700'}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-sm shrink-0">{opt.flag}</span>
                              <span className="font-bold shrink-0">{opt.code}</span>
                              <span className="text-slate-400 font-normal truncate max-w-[120px]">{opt.name}</span>
                            </span>
                            {opt.country && (
                              <span className="text-[9px] text-slate-400 truncate max-w-[80px] font-mono text-right shrink-0">{opt.country.split(',')[0].split(' (')[0]}</span>
                            )}
                          </button>
                        ))}
                      {receiveOptions.filter(opt => {
                        const query = searchQuery.toLowerCase();
                        return (
                          opt.code.toLowerCase().includes(query) ||
                          opt.name.toLowerCase().includes(query) ||
                          (opt.country && opt.country.toLowerCase().includes(query))
                        );
                      }).length === 0 && (
                        <div className="text-center py-4 text-xs text-slate-400 font-medium">No countries matched</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Exchange Rate Market Graph (SVG Model) */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              AI Exchange Predictor
            </span>
            <span className="text-[10px] text-slate-400 font-medium">5-Day USD Forward Forecast</span>
          </div>

          {/* Inline SVG Chart */}
          {loadingInsights ? (
            <div className="h-28 flex items-center justify-center text-xs text-slate-400 animate-pulse">
              Computing forecast indices...
            </div>
          ) : (
            <div className="relative">
              <svg className="w-full h-24 overflow-visible select-none" viewBox="0 0 350 110">
                {/* Horizontal reference line */}
                <line x1="20" y1="90" x2="330" y2="90" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="20" y1="20" x2="330" y2="20" stroke="#f1f5f9" strokeWidth="1" />

                {/* Main line trend path */}
                {dPath && (
                  <path
                    d={dPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Highlight dots and text */}
                {svgPoints.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      className="fill-emerald-500 stroke-white stroke-2 hover:r-6 cursor-pointer transition-all"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      className="text-[9px] font-bold font-mono fill-emerald-800"
                    >
                      {pt.rate}
                    </text>
                    <text
                      x={pt.x}
                      y="105"
                      textAnchor="middle"
                      className="text-[9px] font-semibold font-mono fill-slate-400 uppercase"
                    >
                      {pt.day}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Insights text list */}
              {aiInsights && (
                <div className="mt-4 pt-3 border-t border-slate-200/50">
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-relaxed bg-white border border-slate-200/60 p-2.5 rounded-lg shadow-sm">
                    <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div dangerouslySetInnerHTML={{ __html: aiInsights.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
