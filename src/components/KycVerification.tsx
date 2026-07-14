/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KycSubmission } from '../types';
import { ShieldCheck, Upload, AlertCircle, CheckCircle2, RefreshCw, Eye } from 'lucide-react';

interface KycVerificationProps {
  kyc: KycSubmission | null;
  onSubmitKyc: (kycDetails: any) => Promise<void>;
  onTriggerAdminDecision: (decision: 'approve' | 'reject', reasons?: string[]) => Promise<void>;
}

export default function KycVerification({
  kyc,
  onSubmitKyc,
  onTriggerAdminDecision,
}: KycVerificationProps) {
  const [docType, setDocType] = useState<'passport' | 'drivers_license' | 'national_id'>('passport');
  const [docNumber, setDocNumber] = useState('');
  const [fullName, setFullName] = useState('Sium Sahaye');
  const [dob, setDob] = useState('1992-05-14');
  const [country, setCountry] = useState('United States');
  const [address, setAddress] = useState('100 California St, San Francisco, CA 94111');
  
  const [submitting, setSubmitting] = useState(false);
  const [adminReasons, setAdminReasons] = useState('Verification approved. Document numbers and biometric matches clear.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber || !fullName) {
      alert("Please fill out complete identity credentials.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitKyc({
        documentType: docType,
        documentNumber: docNumber,
        fullName,
        dateOfBirth: dob,
        country,
        address,
      });
    } catch (err: any) {
      alert(err.message || "Failed to submit validation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <ShieldCheck className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">Identity Verification Desk (KYC)</h2>
          <p className="text-xs text-slate-500">Submit and audit official documents to satisfy international AML transfer guidelines.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Verification Status Overview card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Your KYC Status</h3>
            
            {kyc ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {kyc.status === 'approved' && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/10" /> Approved
                    </span>
                  )}
                  {kyc.status === 'pending' && (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pending Approval
                    </span>
                  )}
                  {kyc.status === 'rejected' && (
                    <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Action Required
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs pt-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Legal Name:</span>
                    <span className="font-bold text-white">{kyc.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Doc Type:</span>
                    <span className="font-bold text-white uppercase">{kyc.documentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Doc ID:</span>
                    <span className="font-bold text-white">{kyc.documentNumber}</span>
                  </div>
                </div>

                {kyc.reasons && (
                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-[11px] leading-relaxed text-slate-300">
                    <span className="font-bold text-slate-200 block mb-1">Compliance Notes:</span>
                    {kyc.reasons}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">No identity document on file yet.</p>
                <p className="text-[11px] text-slate-500">Verification is required for single transactions exceeding $1,000 USD or high cumulative volumes.</p>
              </div>
            )}
          </div>

          {/* Interactive Compliance Decision Box (SANDBOX CONTROLS) */}
          {kyc && kyc.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4.5 h-4.5 text-amber-600" />
                Compliance Officer Admin controls
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                You are currently running in a fully integrated sandbox workspace. As the Compliance Officer, you can instantly <strong>Approve</strong> or <strong>Reject</strong> this submission below to observe how downstream sending and limit thresholds are unlocked!
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Verification Decision Notes</label>
                <textarea
                  value={adminReasons}
                  onChange={(e) => setAdminReasons(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:outline-none focus:border-amber-500 text-slate-700 min-h-[60px]"
                  placeholder="Compliance review details..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onTriggerAdminDecision('reject', [adminReasons || 'Failed document parsing. Name mismatch.'])}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onTriggerAdminDecision('approve', [adminReasons || 'Approved matches.'])}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition-colors"
                >
                  Approve ID
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Verification Form Area */}
        <div className="lg:col-span-2">
          {(!kyc || kyc.status === 'rejected') ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 block">Submit Legal Credentials</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="passport">Passport (International)</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="national_id">National ID Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Document Serial Number</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="e.g. US9876543A"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Legal Name (Match Document)</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      placeholder="e.g. Sium Sahaye"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Residency Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Current Physical Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Simulated File upload interface */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50 select-none">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Document Photo Scan</span>
                    <span className="text-[9px] text-slate-400">Front scan of your Official Passport or License (Max 5MB)</span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold">
                      ✓ id_front_page.jpg auto-ready
                    </span>
                  </div>

                  <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50 select-none">
                    <Eye className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Biometric Selfie Matching</span>
                    <span className="text-[9px] text-slate-400">High contrast webcam portrait photo of your face (Max 5MB)</span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold">
                      ✓ bio_selfie_face.jpg auto-ready
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Submitting validation logs...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Submit Verification Credentials
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 shadow-sm select-none">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Identity Document Fully Verified</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your identity audit results are clear. Your individual remittance limits have been elevated to <strong>$10,000.00 USD per day</strong>. Thank you for maintaining secure, compliant remittance parameters.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-w-sm mx-auto font-mono text-left text-[11px] text-slate-600 space-y-1">
                <div>• Approved: {new Date(kyc.submittedAt).toLocaleDateString()}</div>
                <div>• Verified ID Ref: {kyc.documentNumber}</div>
                <div>• Clearing Hub ID: REMIT-US-WEST-912</div>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
