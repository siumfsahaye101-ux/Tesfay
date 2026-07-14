/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateVsUsd: number;
  flag: string;
  type: 'send' | 'receive' | 'both';
  country?: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  country: string;
  currency: string;
  relationship: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  referenceNumber: string;
  senderId: string;
  senderName: string;
  beneficiaryId: string;
  beneficiaryName: string;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  exchangeRate: number;
  transferFee: number;
  paymentMethod: 'bank_transfer' | 'debit_card' | 'credit_card' | 'wallet';
  payoutMethod: 'bank_deposit' | 'cash_pickup' | 'mobile_wallet';
  status: 'initiated' | 'processing' | 'aml_review' | 'dispatched' | 'completed' | 'cancelled';
  riskScore: number;
  riskReasons: string[];
  kycRequired: boolean;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
}

export interface Wallet {
  currency: string;
  balance: number;
  symbol: string;
}

export interface KycSubmission {
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  selfieUrl: string;
  documentFrontUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reasons?: string[];
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
