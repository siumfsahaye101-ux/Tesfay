/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CurrencyConverter from './components/CurrencyConverter';
import TransferWizard from './components/TransferWizard';
import KycVerification from './components/KycVerification';
import Dashboard from './components/Dashboard';
import AdminTerminal from './components/AdminTerminal';
import SupportChat from './components/SupportChat';
import UserDropdown from './components/UserDropdown';
import { Transfer, Wallet, Beneficiary, KycSubmission, AuditLog, ChatMessage, CurrencyRate } from './types';
import { ShieldCheck, MessageSquareCode, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation & panels
  const [activeTab, setActiveTab] = useState<'send' | 'dashboard' | 'kyc' | 'admin'>('send');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Core App states
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [kyc, setKyc] = useState<KycSubmission | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiStatus, setApiStatus] = useState({ ok: false, hasApiKey: false, loading: true });

  // Calculator states
  const [sendAmount, setSendAmount] = useState(500);
  const [sendCurrency, setSendCurrency] = useState('USD');
  const [receiveCurrency, setReceiveCurrency] = useState('INR');
  const [rateLockTimer, setRateLockTimer] = useState(120); // 2 minutes countdown

  // Chatbot states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Initialize data on start
  useEffect(() => {
    fetchApiStatus();
    fetchWallets();
    fetchRates();
    fetchBeneficiaries();
    fetchTransfers();
    fetchKyc();
    fetchAuditLogs();
  }, []);

  // Sync calculations
  const activeSendRate = rates.find(r => r.code === sendCurrency);
  const activeRecRate = rates.find(r => r.code === receiveCurrency);
  const exchangeRate = activeSendRate && activeRecRate ? (activeRecRate.rateVsUsd / activeSendRate.rateVsUsd) : 1;

  // Promos / fee calculation
  const transferFee = sendAmount >= 1000 ? 0 : 2.99; 
  const totalPayable = sendAmount + transferFee;
  const receiveAmount = sendAmount * exchangeRate;

  // 120-second dynamic Rate Lock timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLockTimer((prev) => {
        if (prev <= 1) {
          fetchRates(); // Re-trigger exchange rate update from backend
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch functions linked to Express API
  const fetchApiStatus = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setApiStatus({ ok: true, hasApiKey: data.hasApiKey, loading: false });
    } catch {
      setApiStatus({ ok: false, hasApiKey: false, loading: false });
    }
  };

  const fetchWallets = async () => {
    try {
      const res = await fetch('/api/wallets');
      const data = await res.json();
      setWallets(data);
    } catch (err) {
      console.error('Failed to retrieve wallets', err);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      setRates(data);
    } catch (err) {
      console.error('Failed to retrieve rates', err);
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch('/api/beneficiaries');
      const data = await res.json();
      setBeneficiaries(data);
    } catch (err) {
      console.error('Failed to retrieve beneficiaries', err);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await fetch('/api/transfers');
      const data = await res.json();
      setTransfers(data);
    } catch (err) {
      console.error('Failed to retrieve transfers', err);
    }
  };

  const fetchKyc = async () => {
    try {
      const res = await fetch('/api/compliance/kyc');
      const data = await res.json();
      setKyc(data);
    } catch (err) {
      console.error('Failed to retrieve KYC state', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to retrieve audit logs', err);
    }
  };

  const handleResetSandbox = async () => {
    try {
      const res = await fetch('/api/sandbox/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchWallets();
        fetchTransfers();
        fetchKyc();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error("Failed to reset sandbox:", err);
    }
  };

  // State modification handlers
  const handleFundWallet = async (amount: number, currency: string) => {
    const res = await fetch('/api/wallets/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency })
    });
    const data = await res.json();
    if (data.success) {
      fetchWallets();
      fetchAuditLogs();
    }
  };

  const handleAddBeneficiary = async (benDetails: Omit<Beneficiary, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/beneficiaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(benDetails)
    });
    const added = await res.json();
    fetchBeneficiaries();
    fetchAuditLogs();
    return added;
  };

  const handleInitiateTransfer = async (payload: any) => {
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.error) {
      throw new Error(result.message || result.error);
    }
    fetchTransfers();
    fetchWallets();
    fetchAuditLogs();
    return result;
  };

  const handleStatusChange = async (id: string, status: any) => {
    const res = await fetch(`/api/transfers/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      fetchTransfers();
      fetchWallets();
      fetchAuditLogs();
    }
  };

  const handleSubmitKyc = async (details: any) => {
    const res = await fetch('/api/compliance/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    const data = await res.json();
    setKyc(data);
    fetchAuditLogs();
  };

  const handleKycDecision = async (decision: 'approve' | 'reject', reasons?: string[]) => {
    const res = await fetch('/api/compliance/kyc/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reasons })
    });
    const data = await res.json();
    setKyc(data);
    fetchTransfers();
    fetchAuditLogs();
  };

  const handleSendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setLoadingChat(true);

    try {
      const res = await fetch('/api/ai/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: updatedHistory })
      });
      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `chat-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.text || 'Unable to connect to AI Support services at this time.',
        timestamp: new Date().toISOString()
      };
      setChatHistory([...updatedHistory, botMsg]);
    } catch {
      const botMsg: ChatMessage = {
        id: `chat-${Date.now() + 1}`,
        sender: 'assistant',
        text: 'AI services returned an error. Ensure GEMINI_API_KEY is configured correctly.',
        timestamp: new Date().toISOString()
      };
      setChatHistory([...updatedHistory, botMsg]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletBalance={wallets}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        apiStatus={apiStatus}
      />

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Current Corridor</span>
            <span className="bg-slate-100 border border-slate-200/60 text-slate-700 font-mono text-[11px] px-2.5 py-0.5 rounded-md font-bold">
              {sendCurrency} ➜ {receiveCurrency}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <UserDropdown
              kyc={kyc}
              wallets={wallets}
              transfers={transfers}
              rates={rates}
              receiveCurrency={receiveCurrency}
              setReceiveCurrency={setReceiveCurrency}
              onResetSandbox={handleResetSandbox}
              onNavigateToKyc={() => setActiveTab('kyc')}
            />
          </div>
        </header>

        {/* Dynamic View Panel wrapper */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'send' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                
                {/* Left side: Calculator */}
                <div className="lg:col-span-2">
                  <CurrencyConverter
                    rates={rates}
                    sendAmount={sendAmount}
                    setSendAmount={setSendAmount}
                    sendCurrency={sendCurrency}
                    setSendCurrency={setSendCurrency}
                    receiveCurrency={receiveCurrency}
                    setReceiveCurrency={setReceiveCurrency}
                    fee={transferFee}
                    totalPayable={totalPayable}
                    receiveAmount={receiveAmount}
                    rateLockTimer={rateLockTimer}
                  />
                </div>

                {/* Right side: Send Wizard */}
                <div className="lg:col-span-3">
                  <TransferWizard
                    beneficiaries={beneficiaries}
                    onAddBeneficiary={handleAddBeneficiary}
                    onInitiateTransfer={handleInitiateTransfer}
                    sendAmount={sendAmount}
                    sendCurrency={sendCurrency}
                    receiveCurrency={receiveCurrency}
                    receiveAmount={receiveAmount}
                    exchangeRate={exchangeRate}
                    transferFee={transferFee}
                    kyc={kyc}
                    onNavigateToKyc={() => setActiveTab('kyc')}
                    rates={rates}
                  />
                </div>

              </div>
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                transfers={transfers}
                wallets={wallets}
                onFundWallet={handleFundWallet}
                onTriggerStatusChange={handleStatusChange}
              />
            )}

            {activeTab === 'kyc' && (
              <KycVerification
                kyc={kyc}
                onSubmitKyc={handleSubmitKyc}
                onTriggerAdminDecision={handleKycDecision}
              />
            )}

            {activeTab === 'admin' && (
              <AdminTerminal
                transfers={transfers}
                onTriggerStatusChange={handleStatusChange}
                auditLogs={auditLogs}
                onFetchAuditLogs={fetchAuditLogs}
              />
            )}
          </div>

        </div>

        {/* AI support slide-out sidebar panel */}
        <SupportChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          chatHistory={chatHistory}
          onSendMessage={handleSendChatMessage}
          loadingChat={loadingChat}
        />

      </main>

    </div>
  );
}
