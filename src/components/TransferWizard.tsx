/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Beneficiary, Transfer, KycSubmission, CurrencyRate } from '../types';
import { 
  Users, 
  CreditCard, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  UserPlus, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  X,
  Lock,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';

interface TransferWizardProps {
  beneficiaries: Beneficiary[];
  onAddBeneficiary: (ben: Omit<Beneficiary, 'id' | 'createdAt'>) => Promise<Beneficiary>;
  onInitiateTransfer: (transfer: any) => Promise<Transfer>;
  sendAmount: number;
  sendCurrency: string;
  receiveCurrency: string;
  receiveAmount: number;
  exchangeRate: number;
  transferFee: number;
  kyc: KycSubmission | null;
  onNavigateToKyc: () => void;
  rates: CurrencyRate[];
}

export default function TransferWizard({
  beneficiaries,
  onAddBeneficiary,
  onInitiateTransfer,
  sendAmount,
  sendCurrency,
  receiveCurrency,
  receiveAmount,
  exchangeRate,
  transferFee,
  kyc,
  onNavigateToKyc,
  rates,
}: TransferWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedBenId, setSelectedBenId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'debit_card' | 'credit_card' | 'wallet'>('wallet');
  const [payoutMethod, setPayoutMethod] = useState<'bank_deposit' | 'cash_pickup' | 'mobile_wallet'>('bank_deposit');

  // New beneficiary form state
  const [showAddBen, setShowAddBen] = useState(false);
  const [newBenName, setNewBenName] = useState('');
  const [newBenEmail, setNewBenEmail] = useState('');
  const [newBenPhone, setNewBenPhone] = useState('');
  const [newBenBank, setNewBenBank] = useState('');
  const [newBenAccount, setNewBenAccount] = useState('');
  const [newBenRelation, setNewBenRelation] = useState('Family');

  // AI Security Checks
  const [checkingAml, setCheckingAml] = useState(false);
  const [amlScreenResult, setAmlScreenResult] = useState<any>(null);
  const [fraudScoreResult, setFraudScoreResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Successful Transfer outcome state
  const [completedTx, setCompletedTx] = useState<Transfer | null>(null);

  // Auto-fill beneficiary country & currency based on the destination currency selected
  const getDestinationCountry = (curr: string) => {
    const matchedRate = rates.find(r => r.code === curr);
    if (matchedRate && matchedRate.country) {
      return matchedRate.country.split(' (')[0].split(', ')[0];
    }
    switch (curr) {
      case 'INR': return 'India';
      case 'MXN': return 'Mexico';
      case 'PHP': return 'Philippines';
      case 'NGN': return 'Nigeria';
      case 'GHS': return 'Ghana';
      case 'COP': return 'Colombia';
      case 'PKR': return 'Pakistan';
      case 'BDT': return 'Bangladesh';
      case 'VND': return 'Vietnam';
      case 'EUR': return 'Europe (Eurozone)';
      case 'GBP': return 'United Kingdom';
      default: return 'Global Remit';
    }
  };

  const activeBeneficiary = beneficiaries.find(b => b.id === selectedBenId);

  // Trigger AI Sanction check & Fraud scoring when arriving at compliance step (step 3)
  useEffect(() => {
    if (step === 3 && activeBeneficiary) {
      runComplianceReview();
    }
  }, [step, selectedBenId]);

  const runComplianceReview = async () => {
    setCheckingAml(true);
    setErrorMessage('');
    try {
      // 1. Backend AML Sanctions lookup
      const amlRes = await fetch('/api/compliance/aml-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeBeneficiary?.name, country: activeBeneficiary?.country })
      });
      const amlData = await amlRes.json();
      setAmlScreenResult(amlData);

      // 2. AI Risk Scoring Engine
      const riskRes = await fetch('/api/ai/fraud-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferDetails: {
            sendAmount,
            beneficiaryName: activeBeneficiary?.name,
            relationship: activeBeneficiary?.relationship,
            country: activeBeneficiary?.country,
            receiveCurrency,
            paymentMethod,
            payoutMethod,
          }
        })
      });
      const riskData = await riskRes.json();
      setFraudScoreResult(riskData);
    } catch (err: any) {
      console.error("Compliance Screening Interrupted", err);
      setErrorMessage("Compliance AI was unable to audit this transfer. Try again.");
    } finally {
      setCheckingAml(false);
    }
  };

  const handleCreateBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBenName || !newBenBank || !newBenAccount) {
      alert("Please fill in recipient name, bank, and account number.");
      return;
    }

    try {
      const added = await onAddBeneficiary({
        name: newBenName,
        email: newBenEmail,
        phone: newBenPhone,
        bankName: newBenBank,
        accountNumber: newBenAccount,
        country: getDestinationCountry(receiveCurrency),
        currency: receiveCurrency,
        relationship: newBenRelation,
      });

      setSelectedBenId(added.id);
      setShowAddBen(false);
      // Clear inputs
      setNewBenName('');
      setNewBenEmail('');
      setNewBenPhone('');
      setNewBenBank('');
      setNewBenAccount('');
    } catch (err: any) {
      alert("Failed to save beneficiary: " + err.message);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!activeBeneficiary) return;

    // Check KYC requirement threshold ($1000 threshold)
    if (sendAmount >= 1000 && (!kyc || kyc.status !== 'approved')) {
      alert("Remittances over $1,000 require Identity Verification. Please submit your ID under the Identity tab.");
      return;
    }

    try {
      const payload = {
        beneficiaryId: selectedBenId,
        sendAmount,
        sendCurrency,
        receiveAmount,
        receiveCurrency,
        exchangeRate,
        transferFee,
        paymentMethod,
        payoutMethod,
        riskScore: fraudScoreResult?.riskScore || 10,
        riskReasons: fraudScoreResult?.reasons || ["Standard remittance profiling"],
      };

      const result = await onInitiateTransfer(payload);
      setCompletedTx(result);
      setStep(5); // Success step
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to finalize transfer transaction.");
    }
  };

  // Reset wizard
  const resetWizard = () => {
    setStep(1);
    setSelectedBenId('');
    setCompletedTx(null);
    setAmlScreenResult(null);
    setFraudScoreResult(null);
  };

  // Filter beneficiaries to current target receive currency context
  const filteredBens = beneficiaries.filter(b => b.currency === receiveCurrency);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between min-h-[500px]">
      
      {/* Header step guide */}
      {step < 5 && (
        <div className="border-b border-slate-100 pb-4 select-none">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className={step === 1 ? 'text-indigo-600 font-bold' : ''}>1. Recipient</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={step === 2 ? 'text-indigo-600 font-bold' : ''}>2. Funding</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={step === 3 ? 'text-indigo-600 font-bold' : ''}>3. Safety Screening</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className={step === 4 ? 'text-indigo-600 font-bold' : ''}>4. Complete</span>
          </div>
        </div>
      )}

      {/* Main Form Area */}
      <div className="flex-1 my-6">

        {/* STEP 1: Select Beneficiary */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Users className="w-4 h-4 text-indigo-500" />
                Select Recipient in {getDestinationCountry(receiveCurrency)}
              </h3>
              <button
                onClick={() => setShowAddBen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                Add New Recipient
              </button>
            </div>

            {/* Recipient Cards Grid */}
            {filteredBens.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">No saved recipients found in {getDestinationCountry(receiveCurrency)}.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add a recipient bank detail to unlock the transfer portal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {filteredBens.map((ben) => (
                  <div
                    key={ben.id}
                    onClick={() => setSelectedBenId(ben.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedBenId === ben.id
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{ben.name}</span>
                      <span className="text-[10px] bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-500">
                        {ben.relationship}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">{ben.bankName} • ****{ben.accountNumber.slice(-4)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{ben.email || ben.phone || 'No contact specified'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Beneficiary Drawer Overlay */}
            {showAddBen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-500" />
                      Add Recipient for {receiveCurrency}
                    </h4>
                    <button onClick={() => setShowAddBen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateBeneficiary} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Full Legal Name</label>
                        <input
                          type="text"
                          value={newBenName}
                          onChange={(e) => setNewBenName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                          placeholder="Johnathan Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Relationship</label>
                        <select
                          value={newBenRelation}
                          onChange={(e) => setNewBenRelation(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer text-slate-700"
                        >
                          <option value="Family">Family/Brother</option>
                          <option value="Friend">Friend</option>
                          <option value="Business Partner">Business Partner</option>
                          <option value="Savings Account">Personal Account</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={newBenEmail}
                          onChange={(e) => setNewBenEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800"
                          placeholder="optional@recipient.com"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={newBenPhone}
                          onChange={(e) => setNewBenPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800"
                          placeholder="+1 555-123-4567"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Payout Bank Name</label>
                        <input
                          type="text"
                          value={newBenBank}
                          onChange={(e) => setNewBenBank(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800"
                          placeholder="e.g. BBVA Bancomer, Zenith Bank"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">IBAN / Account Number</label>
                        <input
                          type="text"
                          value={newBenAccount}
                          onChange={(e) => setNewBenAccount(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800"
                          placeholder="e.g. 012180012345678901"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddBen(false)}
                        className="flex-1 py-2 px-3 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-100 transition-all"
                      >
                        Save Recipient
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Funding & Delivery Channel */}
        {step === 2 && (
          <div className="space-y-5 select-none animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-3">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                Choose Funding Method
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'wallet'
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      USD Wallet Balance
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">Instant</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Deduct immediately from your multi-currency ledger.</p>
                </div>

                <div
                  onClick={() => setPaymentMethod('debit_card')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'debit_card'
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-500" />
                      Debit Card (Visa/MC)
                    </span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono">10 min</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Secure payment processing with locked rate protection.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide mb-3">
                <ChevronRight className="w-4 h-4 text-indigo-500" />
                Select Payout Channel
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {['bank_deposit', 'cash_pickup', 'mobile_wallet'].map((method) => (
                  <div
                    key={method}
                    onClick={() => setPayoutMethod(method as any)}
                    className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                      payoutMethod === method
                        ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 text-xs'
                    }`}
                  >
                    <span className="text-xs capitalize block">
                      {method.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Compliance & AI Risk Screening */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in select-none">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
              Automated AI Compliance & Risk Screen
            </h3>

            {checkingAml ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800">Screening Sender & Recipient indices...</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">OFAC SDN lists • PEP Registers • AML Fraud Profiling</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* 1. Global Sanctions check status */}
                <div className={`p-4 rounded-xl border ${
                  amlScreenResult?.isSanctioned 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-emerald-50/30 border-emerald-100 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      {amlScreenResult?.isSanctioned ? (
                        <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      )}
                      International Sanction Clearance
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono bg-white shadow-xs border border-slate-200/50">
                      Confidence: {amlScreenResult?.matchConfidence || 100}%
                    </span>
                  </div>
                  <p className="text-[11px] mt-1.5 text-slate-600 leading-normal">{amlScreenResult?.details}</p>
                </div>

                {/* 2. Fraud Score indicators */}
                {fraudScoreResult && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col justify-between border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Risk Score</span>
                      <div className="my-2 flex items-baseline gap-1.5">
                        <span className={`text-4xl font-extrabold font-mono tracking-tight ${
                          fraudScoreResult.riskScore >= 50 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {fraudScoreResult.riskScore}
                        </span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {fraudScoreResult.riskScore >= 50 ? '● HIGH AML REVIEW REQUIRED' : '● LOW FRAUD CORRELATION'}
                      </span>
                    </div>

                    <div className="col-span-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Explainable Security Audit Reasons:</span>
                      <ul className="text-[11px] text-slate-600 space-y-1 pl-4 list-disc">
                        {fraudScoreResult.reasons?.map((r: string, idx: number) => (
                          <li key={idx} className="leading-relaxed">{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Transaction threshold blocker warning */}
                {sendAmount >= 1000 && (!kyc || kyc.status !== 'approved') && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 uppercase">KYC Verification Block</h4>
                      <p className="text-[11px] text-rose-700 leading-relaxed mt-1">
                        Remittances equal to or greater than $1,000 USD require legal identity confirmation on file. Since you do not currently have an approved submission on file, please complete validation inside the "Identity (KYC Desk)" tab first.
                      </p>
                      <button
                        onClick={onNavigateToKyc}
                        className="mt-2.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                      >
                        Go to Identity Desk
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Review and Submit */}
        {step === 4 && activeBeneficiary && (
          <div className="space-y-4 animate-fade-in select-none">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-100 pb-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              Final Transfer Overview
            </h3>

            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 divide-y divide-slate-200/60 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs py-1.5">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-slate-800 text-right">{activeBeneficiary.country}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs py-1.5">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-bold text-slate-800 text-right">{activeBeneficiary.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs py-1.5">
                <span className="text-slate-500">Bank & Account:</span>
                <span className="font-mono text-slate-700 text-right">{activeBeneficiary.bankName} • ****{activeBeneficiary.accountNumber.slice(-4)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs py-1.5">
                <span className="text-slate-500">Funding Source:</span>
                <span className="font-semibold capitalize text-slate-800 text-right">{paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs py-1.5">
                <span className="text-slate-500">Payment breakdown:</span>
                <span className="font-mono text-slate-700 text-right">
                  ${sendAmount.toFixed(2)} + ${transferFee.toFixed(2)} Fee = <span className="font-bold text-slate-900">${(sendAmount + transferFee).toFixed(2)} USD</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1.5">
                <span className="text-emerald-700 font-bold">Payout Amount:</span>
                <span className="font-mono font-extrabold text-emerald-600 text-right text-sm">
                  {receiveAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {receiveCurrency}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 italic bg-amber-50 border border-amber-100/50 p-2.5 rounded-lg leading-normal">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              This is a fully compliant transfer sandbox execution. Initiating this will log the AML check results and update your virtual multi-currency ledger securely.
            </div>
          </div>
        )}

        {/* STEP 5: Success Output */}
        {step === 5 && completedTx && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Transfer Securely Initiated</h3>
              <p className="text-xs text-slate-500">Ref Number: <span className="font-mono font-bold text-slate-800">{completedTx.referenceNumber}</span></p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 max-w-sm w-full space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-bold text-slate-800">{completedTx.beneficiaryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid out via:</span>
                <span className="font-semibold text-slate-800 capitalize">{completedTx.payoutMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Funds Transferred:</span>
                <span className="font-mono font-bold text-slate-800">${completedTx.sendAmount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2 text-emerald-700">
                <span className="font-bold">Estimated Delivery:</span>
                <span className="font-semibold">{new Date(completedTx.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Compliance Code:</span>
                <span className="font-mono">RISK-{completedTx.riskScore} / AML-{completedTx.status.toUpperCase()}</span>
              </div>
            </div>

            <button
              onClick={resetWizard}
              className="w-full max-w-sm py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-slate-900/10"
            >
              Start Another Transfer
            </button>
          </div>
        )}

      </div>

      {/* Navigation Buttons footer */}
      {step < 5 && (
        <div className="flex justify-between items-center border-t border-slate-100 pt-4">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 py-2 px-3 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedBenId) ||
                (step === 3 && checkingAml) ||
                (step === 3 && sendAmount >= 1000 && (!kyc || kyc.status !== 'approved'))
              }
              className="flex items-center gap-1.5 py-2 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold transition-all hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleConfirmTransfer}
              className="flex items-center gap-1.5 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-100"
            >
              Authorize Send
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

    </div>
  );
}
