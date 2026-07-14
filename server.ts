/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Beneficiary, Transfer, Wallet, KycSubmission, AuditLog, CurrencyRate } from "./src/types";

// Load environment variables
dotenv.config();

const PORT = 3000;

// Lazy initialization of GoogleGenAI
let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return null instead of crashing, so we can support peaceful key-missing warnings in the UI
    return null;
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// ----------------------------------------------------
// Mock Database / State Store
// ----------------------------------------------------
const walletStore: Wallet[] = [
  { currency: "USD", balance: 14250.00, symbol: "$" },
  { currency: "EUR", balance: 350.00, symbol: "€" },
  { currency: "GBP", balance: 120.00, symbol: "£" },
];

const currencyRates: CurrencyRate[] = [
  { code: "USD", name: "United States Dollar", symbol: "$", rateVsUsd: 1.0, flag: "🇺🇸", type: "both", country: "United States, Ecuador, El Salvador, Panama, Palau" },
  { code: "EUR", name: "Euro", symbol: "€", rateVsUsd: 0.92, flag: "🇪🇺", type: "both", country: "Eurozone (Germany, France, Italy, Spain, Netherlands, Ireland, Portugal, Greece, Austria, Belgium, Finland)" },
  { code: "GBP", name: "British Pound", symbol: "£", rateVsUsd: 0.78, flag: "🇬🇧", type: "both", country: "United Kingdom, Guernsey, Jersey, Isle of Man" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$", rateVsUsd: 1.36, flag: "🇨🇦", type: "receive", country: "Canada" },
  { code: "AUD", name: "Australian Dollar", symbol: "$", rateVsUsd: 1.49, flag: "🇦🇺", type: "receive", country: "Australia, Kiribati, Nauru, Tuvalu" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$", rateVsUsd: 1.63, flag: "🇳🇿", type: "receive", country: "New Zealand, Cook Islands, Niue, Tokelau" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", rateVsUsd: 156.40, flag: "🇯🇵", type: "receive", country: "Japan" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", rateVsUsd: 7.24, flag: "🇨🇳", type: "receive", country: "China" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", rateVsUsd: 83.45, flag: "🇮🇳", type: "receive", country: "India" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", rateVsUsd: 17.15, flag: "🇲🇽", type: "receive", country: "Mexico" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", rateVsUsd: 56.20, flag: "🇵🇭", type: "receive", country: "Philippines" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", rateVsUsd: 1480.00, flag: "🇳🇬", type: "receive", country: "Nigeria" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", rateVsUsd: 14.50, flag: "🇬🇭", type: "receive", country: "Ghana" },
  { code: "COP", name: "Colombian Peso", symbol: "$", rateVsUsd: 3950.00, flag: "🇨🇴", type: "receive", country: "Colombia" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", rateVsUsd: 278.30, flag: "🇵🇰", type: "receive", country: "Pakistan" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", rateVsUsd: 117.20, flag: "🇧🇩", type: "receive", country: "Bangladesh" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", rateVsUsd: 25450.00, flag: "🇻🇳", type: "receive", country: "Vietnam" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", rateVsUsd: 3.67, flag: "🇦🇪", type: "receive", country: "United Arab Emirates" },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", rateVsUsd: 3.75, flag: "🇸🇦", type: "receive", country: "Saudi Arabia" },
  { code: "QAR", name: "Qatar Riyal", symbol: "ر.ق", rateVsUsd: 3.64, flag: "🇶🇦", type: "receive", country: "Qatar" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", rateVsUsd: 0.31, flag: "🇰🇼", type: "receive", country: "Kuwait" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", rateVsUsd: 0.38, flag: "🇧🇭", type: "receive", country: "Bahrain" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع.", rateVsUsd: 0.38, flag: "🇴🇲", type: "receive", country: "Oman" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", rateVsUsd: 0.71, flag: "🇯🇴", type: "receive", country: "Jordan" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$", rateVsUsd: 1.35, flag: "🇸🇬", type: "receive", country: "Singapore" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$", rateVsUsd: 7.81, flag: "🇭🇰", type: "receive", country: "Hong Kong" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", rateVsUsd: 0.90, flag: "🇨🇭", type: "receive", country: "Switzerland, Liechtenstein" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", rateVsUsd: 10.45, flag: "🇸🇪", type: "receive", country: "Sweden" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", rateVsUsd: 10.60, flag: "🇳🇴", type: "receive", country: "Norway" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", rateVsUsd: 6.85, flag: "🇩🇰", type: "receive", country: "Denmark, Greenland, Faroe Islands" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", rateVsUsd: 32.50, flag: "🇹🇷", type: "receive", country: "Turkey" },
  { code: "ZAR", name: "South African Rand", symbol: "R", rateVsUsd: 18.20, flag: "🇿🇦", type: "receive", country: "South Africa, Lesotho, Namibia, Eswatini" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", rateVsUsd: 5.15, flag: "🇧🇷", type: "receive", country: "Brazil" },
  { code: "ARS", name: "Argentine Peso", symbol: "$", rateVsUsd: 885.00, flag: "🇦🇷", type: "receive", country: "Argentina" },
  { code: "CLP", name: "Chilean Peso", symbol: "$", rateVsUsd: 920.00, flag: "🇨🇱", type: "receive", country: "Chile" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/.", rateVsUsd: 3.72, flag: "🇵🇪", type: "receive", country: "Peru" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", rateVsUsd: 47.50, flag: "🇪🇬", type: "receive", country: "Egypt" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", rateVsUsd: 3.68, flag: "🇮🇱", type: "receive", country: "Israel, Palestine" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", rateVsUsd: 16120.00, flag: "🇮🇩", type: "receive", country: "Indonesia" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", rateVsUsd: 4.68, flag: "🇲🇾", type: "receive", country: "Malaysia" },
  { code: "THB", name: "Thai Baht", symbol: "฿", rateVsUsd: 36.40, flag: "🇹🇭", type: "receive", country: "Thailand" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", rateVsUsd: 1365.00, flag: "🇰🇷", type: "receive", country: "South Korea" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", rateVsUsd: 299.50, flag: "🇱🇰", type: "receive", country: "Sri Lanka" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rateVsUsd: 131.00, flag: "🇰🇪", type: "receive", country: "Kenya" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "DH", rateVsUsd: 10.05, flag: "🇲🇦", type: "receive", country: "Morocco, Western Sahara" },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$", rateVsUsd: 58.20, flag: "🇩🇴", type: "receive", country: "Dominican Republic" },
  { code: "CRC", name: "Costa Rican Colón", symbol: "₡", rateVsUsd: 512.00, flag: "🇨🇷", type: "receive", country: "Costa Rica" },
  { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q", rateVsUsd: 7.78, flag: "🇬🇹", type: "receive", country: "Guatemala" },
  { code: "HNL", name: "Honduran Lempira", symbol: "L", rateVsUsd: 24.65, flag: "🇭🇳", type: "receive", country: "Honduras" },
  { code: "NIO", name: "Nicaraguan Córdoba", symbol: "C$", rateVsUsd: 36.75, flag: "🇳🇮", type: "receive", country: "Nicaragua" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U", rateVsUsd: 38.50, flag: "🇺🇾", type: "receive", country: "Uruguay" },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs.", rateVsUsd: 6.90, flag: "🇧🇴", type: "receive", country: "Bolivia" },
  { code: "PYG", name: "Paraguayan Guaraní", symbol: "₲", rateVsUsd: 7510.00, flag: "🇵🇾", type: "receive", country: "Paraguay" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$", rateVsUsd: 155.80, flag: "🇯🇲", type: "receive", country: "Jamaica" },
  { code: "TTD", name: "Trinidad Dollar", symbol: "TT$", rateVsUsd: 6.78, flag: "🇹🇹", type: "receive", country: "Trinidad and Tobago" },
  { code: "BBD", name: "Barbadian Dollar", symbol: "Bds$", rateVsUsd: 2.00, flag: "🇧🇧", type: "receive", country: "Barbados" },
  { code: "BSD", name: "Bahamian Dollar", symbol: "B$", rateVsUsd: 1.00, flag: "🇧🇸", type: "receive", country: "Bahamas" },
  { code: "BZD", name: "Belize Dollar", symbol: "BZ$", rateVsUsd: 2.00, flag: "🇧🇿", type: "receive", country: "Belize" },
  { code: "GYD", name: "Guyanese Dollar", symbol: "G$", rateVsUsd: 209.50, flag: "🇬🇾", type: "receive", country: "Guyana" },
  { code: "SRD", name: "Surinamese Dollar", symbol: "$", rateVsUsd: 34.20, flag: "🇸🇷", type: "receive", country: "Suriname" },
  { code: "KYD", name: "Caymanian Dollar", symbol: "$", rateVsUsd: 0.83, flag: "🇰🇾", type: "receive", country: "Cayman Islands" },
  { code: "HTG", name: "Haitian Gourde", symbol: "G", rateVsUsd: 132.50, flag: "🇭🇹", type: "receive", country: "Haiti" },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", rateVsUsd: 89500.00, flag: "🇱🇧", type: "receive", country: "Lebanon" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", rateVsUsd: 1310.00, flag: "🇮🇶", type: "receive", country: "Iraq" },
  { code: "YER", name: "Yemeni Rial", symbol: "ر.ي", rateVsUsd: 250.30, flag: "🇾🇪", type: "receive", country: "Yemen" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸", rateVsUsd: 442.50, flag: "🇰🇿", type: "receive", country: "Kazakhstan" },
  { code: "UZS", name: "Uzbekistani Som", symbol: "so'm", rateVsUsd: 12620.00, flag: "🇺🇿", type: "receive", country: "Uzbekistan" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾", rateVsUsd: 2.70, flag: "🇬🇪", type: "receive", country: "Georgia" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼", rateVsUsd: 1.70, flag: "🇦🇿", type: "receive", country: "Azerbaijan" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏", rateVsUsd: 388.00, flag: "🇦🇲", type: "receive", country: "Armenia" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", rateVsUsd: 40.50, flag: "🇺🇦", type: "receive", country: "Ukraine" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", rateVsUsd: 3.95, flag: "🇵🇱", type: "receive", country: "Poland" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", rateVsUsd: 22.85, flag: "🇨🇿", type: "receive", country: "Czech Republic" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", rateVsUsd: 358.50, flag: "🇭🇺", type: "receive", country: "Hungary" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", rateVsUsd: 4.58, flag: "🇷🇴", type: "receive", country: "Romania" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв", rateVsUsd: 1.80, flag: "🇧🇬", type: "receive", country: "Bulgaria" },
  { code: "RSD", name: "Serbian Dinar", symbol: "дин.", rateVsUsd: 107.80, flag: "🇷🇸", type: "receive", country: "Serbia" },
  { code: "ALL", name: "Albanian Lek", symbol: "L", rateVsUsd: 93.20, flag: "🇦🇱", type: "receive", country: "Albania" },
  { code: "BAM", name: "Bosnia Convertible Mark", symbol: "KM", rateVsUsd: 1.80, flag: "🇧🇦", type: "receive", country: "Bosnia and Herzegovina" },
  { code: "MKD", name: "Macedonian Denar", symbol: "ден", rateVsUsd: 56.50, flag: "🇲🇰", type: "receive", country: "North Macedonia" },
  { code: "ISK", name: "Icelandic Króna", symbol: "kr", rateVsUsd: 139.20, flag: "🇮🇸", type: "receive", country: "Iceland" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", rateVsUsd: 3750.00, flag: "🇺🇬", type: "receive", country: "Uganda" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", rateVsUsd: 2610.00, flag: "🇹🇿", type: "receive", country: "Tanzania" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw", rateVsUsd: 1310.00, flag: "🇷🇼", type: "receive", country: "Rwanda" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", rateVsUsd: 57.50, flag: "🇪🇹", type: "receive", country: "Ethiopia" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", rateVsUsd: 26.80, flag: "🇿🇲", type: "receive", country: "Zambia" },
  { code: "MWK", name: "Malawian Kwacha", symbol: "MK", rateVsUsd: 1730.00, flag: "🇲🇼", type: "receive", country: "Malawi" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", rateVsUsd: 832.00, flag: "🇦🇴", type: "receive", country: "Angola" },
  { code: "MZN", name: "Mozambican Metical", symbol: "MT", rateVsUsd: 63.80, flag: "🇲🇿", type: "receive", country: "Mozambique" },
  { code: "BWP", name: "Botswana Pula", symbol: "P", rateVsUsd: 13.60, flag: "🇧🇼", type: "receive", country: "Botswana" },
  { code: "NAD", name: "Namibian Dollar", symbol: "$", rateVsUsd: 18.20, flag: "🇳🇦", type: "receive", country: "Namibia" },
  { code: "SZL", name: "Swazi Lilangeni", symbol: "L", rateVsUsd: 18.20, flag: "🇸🇿", type: "receive", country: "Eswatini" },
  { code: "LSL", name: "Lesotho Loti", symbol: "L", rateVsUsd: 18.20, flag: "🇱🇸", type: "receive", country: "Lesotho" },
  { code: "DJF", name: "Djiboutian Franc", symbol: "Fdj", rateVsUsd: 177.70, flag: "🇩🇯", type: "receive", country: "Djibouti" },
  { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk", rateVsUsd: 15.00, flag: "🇪🇷", type: "receive", country: "Eritrea" },
  { code: "SOS", name: "Somali Shilling", symbol: "Sh", rateVsUsd: 571.00, flag: "🇸🇴", type: "receive", country: "Somalia" },
  { code: "LRD", name: "Liberian Dollar", symbol: "$", rateVsUsd: 194.50, flag: "🇱🇷", type: "receive", country: "Liberia" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le", rateVsUsd: 22450.00, flag: "🇸🇱", type: "receive", country: "Sierra Leone" },
  { code: "GMD", name: "Gambian Dalasi", symbol: "D", rateVsUsd: 67.80, flag: "🇬🇲", type: "receive", country: "Gambia" },
  { code: "CVE", name: "Cape Verdean Escudo", symbol: "$", rateVsUsd: 101.50, flag: "🇨🇻", type: "receive", country: "Cape Verde" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨", rateVsUsd: 46.20, flag: "🇲🇺", type: "receive", country: "Mauritius" },
  { code: "SCR", name: "Seychellois Rupee", symbol: "₨", rateVsUsd: 13.45, flag: "🇸🇨", type: "receive", country: "Seychelles" },
  { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", rateVsUsd: 4520.00, flag: "🇲🇬", type: "receive", country: "Madagascar" },
  { code: "KMF", name: "Comorian Franc", symbol: "CF", rateVsUsd: 453.00, flag: "🇰🇲", type: "receive", country: "Comoros" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "Rs", rateVsUsd: 133.50, flag: "🇳🇵", type: "receive", country: "Nepal" },
  { code: "BTN", name: "Bhutanese Ngultrum", symbol: "Nu.", rateVsUsd: 83.45, flag: "🇧🇹", type: "receive", country: "Bhutan" },
  { code: "MVR", name: "Maldivian Rufiyaa", symbol: "Rf", rateVsUsd: 15.40, flag: "🇲🇻", type: "receive", country: "Maldives" },
  { code: "MMR", name: "Myanmar Kyat", symbol: "K", rateVsUsd: 2100.00, flag: "🇲🇲", type: "receive", country: "Myanmar" },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛", rateVsUsd: 4120.00, flag: "🇰🇭", type: "receive", country: "Cambodia" },
  { code: "LAK", name: "Lao Kip", symbol: "₭", rateVsUsd: 21850.00, flag: "🇱🇦", type: "receive", country: "Laos" },
  { code: "MNT", name: "Mongolian Tögrög", symbol: "₮", rateVsUsd: 3380.00, flag: "🇲🇳", type: "receive", country: "Mongolia" },
  { code: "TMT", name: "Turkmenistan Manat", symbol: "T", rateVsUsd: 3.50, flag: "🇹🇲", type: "receive", country: "Turkmenistan" },
  { code: "TJS", name: "Tajikistani Somoni", symbol: "ЅМ", rateVsUsd: 10.90, flag: "🇹🇯", type: "receive", country: "Tajikistan" },
  { code: "KGS", name: "Kyrgyzstani Som", symbol: "сом", rateVsUsd: 87.50, flag: "🇰🇬", type: "receive", country: "Kyrgyzstan" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", rateVsUsd: 3.12, flag: "🇹🇳", type: "receive", country: "Tunisia" },
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", rateVsUsd: 134.50, flag: "🇩🇿", type: "receive", country: "Algeria" },
  { code: "LYD", name: "Libyan Dinar", symbol: "ل.د", rateVsUsd: 4.84, flag: "🇱🇾", type: "receive", country: "Libya" },
  { code: "SDG", name: "Sudanese Pound", symbol: "ج.س.", rateVsUsd: 601.00, flag: "🇸🇩", type: "receive", country: "Sudan" },
  { code: "SSP", name: "South Sudanese Pound", symbol: "£", rateVsUsd: 130.00, flag: "🇸🇸", type: "receive", country: "South Sudan" },
  { code: "MRO", name: "Mauritanian Ouguiya", symbol: "UM", rateVsUsd: 35.60, flag: "🇲🇷", type: "receive", country: "Mauritania" },
  { code: "GNF", name: "Guinean Franc", symbol: "FG", rateVsUsd: 8610.00, flag: "🇬🇳", type: "receive", country: "Guinea" },
  { code: "FJD", name: "Fijian Dollar", symbol: "FJ$", rateVsUsd: 2.25, flag: "🇫🇯", type: "receive", country: "Fiji" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", rateVsUsd: 603.50, flag: "🇨🇲", type: "receive", country: "Cameroon, Central African Republic, Chad, Congo, Equatorial Guinea, Gabon" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateVsUsd: 603.50, flag: "🇸🇳", type: "receive", country: "Senegal, Mali, Ivory Coast, Niger, Burkina Faso, Benin, Togo, Guinea-Bissau" },
  { code: "XCD", name: "East Caribbean Dollar", symbol: "EC$", rateVsUsd: 2.70, flag: "🇱🇨", type: "receive", country: "Saint Lucia, Antigua and Barbuda, Grenada, Saint Kitts and Nevis, Saint Vincent and the Grenadines, Dominica, Anguilla, Montserrat" },
  { code: "XPF", name: "CFP Franc", symbol: "₣", rateVsUsd: 110.00, flag: "🇵🇫", type: "receive", country: "French Polynesia, New Caledonia, Wallis and Futuna Islands" }
];

let beneficiaryStore: Beneficiary[] = [
  {
    id: "ben-1",
    name: "Aarav Sharma",
    email: "aarav.sharma@example.in",
    phone: "+91 98765 43210",
    bankName: "State Bank of India",
    accountNumber: "918273645281",
    country: "India",
    currency: "INR",
    relationship: "Family/Brother",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "ben-2",
    name: "Sofia Rodriguez",
    email: "sofia.rod@example.mx",
    phone: "+52 55 1234 5678",
    bankName: "BBVA Bancomer",
    accountNumber: "012180012345678901",
    country: "Mexico",
    currency: "MXN",
    relationship: "Business Partner",
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "ben-3",
    name: "Amara Adebayo",
    email: "amara.bayo@example.ng",
    phone: "+234 803 123 4567",
    bankName: "Zenith Bank",
    accountNumber: "1012345678",
    country: "Nigeria",
    currency: "NGN",
    relationship: "Friend",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  }
];

let transferStore: Transfer[] = [
  {
    id: "tx-1",
    referenceNumber: "TX-784918239",
    senderId: "user-current",
    senderName: "Sium Sahaye",
    beneficiaryId: "ben-1",
    beneficiaryName: "Aarav Sharma",
    sendAmount: 1200.00,
    sendCurrency: "USD",
    receiveAmount: 100140.00,
    receiveCurrency: "INR",
    exchangeRate: 83.45,
    transferFee: 2.99,
    paymentMethod: "wallet",
    payoutMethod: "bank_deposit",
    status: "completed",
    riskScore: 12,
    riskReasons: ["Standard transfer, familiar beneficiary"],
    kycRequired: false,
    kycStatus: "approved",
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
    estimatedDelivery: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tx-2",
    referenceNumber: "TX-492019385",
    senderId: "user-current",
    senderName: "Sium Sahaye",
    beneficiaryId: "ben-3",
    beneficiaryName: "Amara Adebayo",
    sendAmount: 450.00,
    sendCurrency: "USD",
    receiveAmount: 666000.00,
    receiveCurrency: "NGN",
    exchangeRate: 1480.00,
    transferFee: 3.99,
    paymentMethod: "debit_card",
    payoutMethod: "mobile_wallet",
    status: "processing",
    riskScore: 24,
    riskReasons: ["Medium transfer amount", "Valid KYC on file"],
    kycRequired: false,
    kycStatus: "approved",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  }
];

let kycStore: KycSubmission | null = {
  documentType: "passport",
  documentNumber: "US9876543A",
  fullName: "Sium Sahaye",
  dateOfBirth: "1992-05-14",
  country: "United States",
  address: "100 California St, San Francisco, CA 94111",
  selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
  documentFrontUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop",
  status: "approved",
  submittedAt: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(),
};

let auditLogStore: AuditLog[] = [
  {
    id: "log-1",
    action: "USER_LOGIN",
    details: "User Sium Sahaye logged in from IP 192.168.1.45 (Device: Chrome macOS)",
    severity: "info",
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: "log-2",
    action: "WALLET_FUNDED",
    details: "USD wallet funded with $5,000.00 via Bank ACH (Chase Bank ****1290)",
    severity: "info",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  }
];

// Configuration spreading settings
let systemConfig = {
  fxSpreadMultiplier: 0.008, // 0.8% markup on raw exchange rates
  dailyTransferLimitUsd: 10000.00,
  amlFlagThresholdUsd: 3000.00,
};

// Simple logger helper
function logAction(action: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info') {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    severity,
    timestamp: new Date().toISOString()
  };
  auditLogStore.unshift(newLog);
}

// ----------------------------------------------------
// Server Application Setup
// ----------------------------------------------------
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  // API Routes

  // 1. App Health & State check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      hasApiKey: !!process.env.GEMINI_API_KEY,
      currencyCount: currencyRates.length,
      limitUsd: systemConfig.dailyTransferLimitUsd,
    });
  });

  // 2. Wallet & Balance endpoints
  app.get("/api/wallets", (_req: Request, res: Response) => {
    res.json(walletStore);
  });

  app.post("/api/wallets/fund", (req: Request, res: Response) => {
    try {
      const { amount, currency } = req.body;
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: "Invalid fund amount" });
        return;
      }

      const wallet = walletStore.find(w => w.currency === currency);
      if (wallet) {
        wallet.balance += parsedAmount;
      } else {
        walletStore.push({
          currency,
          balance: parsedAmount,
          symbol: currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"
        });
      }

      logAction("WALLET_FUNDED", `Funded ${currency} wallet with ${parsedAmount} via simulated processor.`, "info");
      res.json({ success: true, wallets: walletStore });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Exchange Rate Fetcher
  app.get("/api/rates", (req: Request, res: Response) => {
    // Add minor mock fluctuation on every retrieval to simulate real-time live trading
    const fluctuatingRates = currencyRates.map(rate => {
      if (rate.code === "USD") return rate;
      const fluctuation = (Math.random() - 0.5) * 0.002; // max +/- 0.1% change
      const modifiedRate = rate.rateVsUsd * (1 + fluctuation);
      return {
        ...rate,
        rateVsUsd: parseFloat(modifiedRate.toFixed(4))
      };
    });
    res.json(fluctuatingRates);
  });

  // 4. Beneficiary Management
  app.get("/api/beneficiaries", (_req: Request, res: Response) => {
    res.json(beneficiaryStore);
  });

  app.post("/api/beneficiaries", (req: Request, res: Response) => {
    try {
      const { name, email, phone, bankName, accountNumber, country, currency, relationship } = req.body;
      if (!name || !bankName || !accountNumber || !country) {
        res.status(400).json({ error: "Missing required beneficiary information" });
        return;
      }

      const newBen: Beneficiary = {
        id: `ben-${Date.now()}`,
        name,
        email: email || "",
        phone: phone || "",
        bankName,
        accountNumber,
        country,
        currency,
        relationship: relationship || "Family",
        createdAt: new Date().toISOString(),
      };

      beneficiaryStore.push(newBen);
      logAction("BENEFICIARY_CREATED", `Added beneficiary ${name} in ${country} (${currency})`, "info");
      res.status(201).json(newBen);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/beneficiaries/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const target = beneficiaryStore.find(b => b.id === id);
    if (!target) {
      res.status(404).json({ error: "Beneficiary not found" });
      return;
    }
    beneficiaryStore = beneficiaryStore.filter(b => b.id !== id);
    logAction("BENEFICIARY_DELETED", `Removed beneficiary ${target.name}`, "warning");
    res.json({ success: true, deletedId: id });
  });

  // 5. Transfer Execution & Pipeline
  app.get("/api/transfers", (_req: Request, res: Response) => {
    res.json(transferStore);
  });

  // Detailed AI Fraud Analysis & Risk Assessment Endpoint
  app.post("/api/ai/fraud-score", async (req: Request, res: Response) => {
    try {
      const { transferDetails } = req.body;
      if (!transferDetails) {
        res.status(400).json({ error: "Transfer details are required" });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        // Fallback for missing API Key to prevent locking developer
        const mockScore = transferDetails.sendAmount > 3000 ? 55 : 12;
        const mockReasons = transferDetails.sendAmount > 3000
          ? ["Transfer exceeds standard $3,000 limit, triggers mandatory enhanced verification.", "Target country risk: high priority AML monitoring."]
          : ["Standard family remittance transfer parameters.", "Clean historic profile matching recipient country."];
        res.json({ riskScore: mockScore, reasons: mockReasons, isAmlFlagged: transferDetails.sendAmount > 3000 });
        return;
      }

      const systemInstruction = `You are the lead AI Compliance & Anti-Money Laundering (AML) officer for a global remittance platform.
Your objective is to inspect a pending transfer transaction and compute an objective Risk Security Score from 0 to 100.
High risk criteria:
- Large transactions (> $2,500)
- Suspicious recipient relationships (e.g. unknown third-party, commercial payment under family remittance code)
- High conflict regions or sanction paths
- Inconsistent funding sources or velocity indicators.

You must respond with a clean JSON object containing:
1. "riskScore": integer (0 to 100)
2. "reasons": array of strings (explaining the rationale behind the score, warning signs, or favorable flags)
3. "isAmlFlagged": boolean (if score >= 50 or exceeds limits)`;

      const userPrompt = `Evaluate the following Remittance Transaction for potential Fraud, AML, and structuring risks:
- Sender Name: Sium Sahaye
- Recipient Name: "${transferDetails.beneficiaryName}" (Relationship: ${transferDetails.relationship})
- Transfer Destination: ${transferDetails.country} (Currency: ${transferDetails.receiveCurrency})
- Sent Volume: $${transferDetails.sendAmount} USD
- Payment Method Chosen: ${transferDetails.paymentMethod}
- Payout Channel: ${transferDetails.payoutMethod}
- User KYC Status on file: ${kycStore ? kycStore.status : "No KYC document submitted"}

Analyze meticulously and calculate the risk indicators. Provide clear feedback in English.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.INTEGER },
              reasons: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              isAmlFlagged: { type: Type.BOOLEAN }
            },
            required: ["riskScore", "reasons", "isAmlFlagged"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);
      res.json(parsed);
    } catch (err: any) {
      console.error("AI Fraud Engine Failure:", err);
      res.status(500).json({ error: "Compliance model failed: " + err.message });
    }
  });

  // Post Transaction Creation (With built-in compliance check)
  app.post("/api/transfers", async (req: Request, res: Response) => {
    try {
      const {
        beneficiaryId,
        sendAmount,
        sendCurrency,
        receiveAmount,
        receiveCurrency,
        exchangeRate,
        transferFee,
        paymentMethod,
        payoutMethod,
        riskScore,
        riskReasons,
      } = req.body;

      if (!beneficiaryId || !sendAmount || !sendCurrency) {
        res.status(400).json({ error: "Invalid transfer specification" });
        return;
      }

      // Check current user KYC status
      if (sendAmount >= 1000 && (!kycStore || kycStore.status !== "approved")) {
        res.status(400).json({
          error: "KYC_REQUIRED",
          message: "Remittance volume exceeds $1,000 limit. Complete your Identity Verification (KYC) first before initiating this send."
        });
        return;
      }

      // Deduct from wallet if funding method is Wallet
      if (paymentMethod === "wallet") {
        const wallet = walletStore.find(w => w.currency === sendCurrency);
        if (!wallet || wallet.balance < (sendAmount + transferFee)) {
          res.status(400).json({ error: "INSUFFICIENT_FUNDS", message: "Your multi-currency wallet does not have sufficient balance to complete this transfer." });
          return;
        }
        wallet.balance -= (sendAmount + transferFee);
      }

      const ben = beneficiaryStore.find(b => b.id === beneficiaryId);
      const beneficiaryName = ben ? ben.name : "Recipient";

      const finalRiskScore = riskScore !== undefined ? riskScore : (sendAmount > 3000 ? 60 : 15);
      const finalReasons = riskReasons || ["Standard system Remittance evaluation"];
      const isSuspicious = finalRiskScore >= 50 || sendAmount >= systemConfig.amlFlagThresholdUsd;

      const newTx: Transfer = {
        id: `tx-${Date.now()}`,
        referenceNumber: `TX-${Math.floor(100000000 + Math.random() * 900000000)}`,
        senderId: "user-current",
        senderName: "Sium Sahaye",
        beneficiaryId,
        beneficiaryName,
        sendAmount,
        sendCurrency,
        receiveAmount,
        receiveCurrency,
        exchangeRate,
        transferFee,
        paymentMethod,
        payoutMethod,
        status: isSuspicious ? "aml_review" : "initiated",
        riskScore: finalRiskScore,
        riskReasons: finalReasons,
        kycRequired: sendAmount >= 1000,
        kycStatus: kycStore ? kycStore.status : "none",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      };

      transferStore.unshift(newTx);
      logAction(
        isSuspicious ? "TX_AML_FLAGGED" : "TX_CREATED",
        `Transfer ${newTx.referenceNumber} to ${beneficiaryName} ($${sendAmount} USD) created with Risk Score: ${finalRiskScore}.`,
        isSuspicious ? "critical" : "info"
      );

      res.status(201).json(newTx);
    } catch (err: any) {
      console.error("Failed to execute transfer:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Transfer Controls (Update status / Release AML)
  app.post("/api/transfers/:id/status", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const tx = transferStore.find(t => t.id === id);
      if (!tx) {
        res.status(404).json({ error: "Transfer not found" });
        return;
      }

      const oldStatus = tx.status;
      tx.status = status;
      tx.updatedAt = new Date().toISOString();

      logAction("TX_STATUS_CHANGED", `Updated Transfer ${tx.referenceNumber} from ${oldStatus} to ${status}.`, "info");
      res.json({ success: true, transfer: tx });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Identity Verification (KYC) Endpoints
  app.get("/api/compliance/kyc", (_req: Request, res: Response) => {
    res.json(kycStore);
  });

  app.post("/api/compliance/kyc", (req: Request, res: Response) => {
    try {
      const { documentType, documentNumber, fullName, dateOfBirth, country, address } = req.body;
      if (!documentType || !fullName || !documentNumber) {
        res.status(400).json({ error: "Missing identity credentials for validation" });
        return;
      }

      kycStore = {
        documentType,
        documentNumber,
        fullName,
        dateOfBirth: dateOfBirth || "1990-01-01",
        country: country || "United States",
        address: address || "Verifiable Address",
        selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
        documentFrontUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop",
        status: "pending",
        submittedAt: new Date().toISOString(),
      };

      logAction("KYC_SUBMITTED", `Identity validation submitted for ${fullName}. Document: ${documentType.toUpperCase()}`, "info");
      res.status(201).json(kycStore);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin KYC decision
  app.post("/api/compliance/kyc/decision", (req: Request, res: Response) => {
    try {
      const { decision, reasons } = req.body;
      if (!kycStore) {
        res.status(400).json({ error: "No pending KYC submission" });
        return;
      }

      kycStore.status = decision === "approve" ? "approved" : "rejected";
      if (reasons) {
        kycStore.reasons = reasons;
      }

      // Sync active transfers kyc status if any are pending
      transferStore.forEach(t => {
        if (t.senderId === "user-current") {
          t.kycStatus = kycStore!.status;
        }
      });

      logAction("KYC_DECISION", `Identity validation request ${decision.toUpperCase()} by AML Compliance admin. Reasons: ${reasons?.join(", ") || "Approved."}`, decision === "approve" ? "info" : "warning");
      res.json(kycStore);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Sanctions PEP checker utilizing AI
  app.post("/api/compliance/aml-check", async (req: Request, res: Response) => {
    try {
      const { name, country } = req.body;
      if (!name) {
        res.status(400).json({ error: "Target name is required for Sanctions Screen" });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        // Fallback checks
        const checkNameLower = name.toLowerCase();
        const hasTrigger = checkNameLower.includes("putin") || checkNameLower.includes("kim jong") || checkNameLower.includes("maduro");
        res.json({
          isSanctioned: hasTrigger,
          matchConfidence: hasTrigger ? 98 : 0,
          details: hasTrigger
            ? "Identified high risk match on international OFAC and PEP Sanction Registers."
            : "No close matching hits identified against OFAC, EU Consolidated, HMT or PEP catalogs.",
          recommendation: hasTrigger ? "IMMEDIATE_BLOCK" : "ALLOW_PROCEED"
        });
        return;
      }

      const systemInstruction = `You are a compliance server screening names against global Sanction lists (such as OFAC SDN, UK HM Treasury, UN consolidated, EU lists) and PEP (Politically Exposed Persons) registers.
Be highly accurate. If the name is known to be associated with an international criminal, terrorist organization, or politically sanctioned leader, trigger high risk warning.
If there is no direct hit, confirm no matching indicators were identified.

Respond with a clean JSON object containing:
1. "isSanctioned": boolean
2. "matchConfidence": integer (0 to 100)
3. "details": string (explain why or why not, quoting potential matches if high)
4. "recommendation": string ("IMMEDIATE_BLOCK", "ENHANCED_DUE_DILIGENCE", or "ALLOW_PROCEED")`;

      const userPrompt = `Screen Target Name: "${name}"
Destination/Residency Country Context: "${country || "Unknown"}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSanctioned: { type: Type.BOOLEAN },
              matchConfidence: { type: Type.INTEGER },
              details: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ["isSanctioned", "matchConfidence", "details", "recommendation"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("AML screen failed:", err);
      res.status(500).json({ error: "Compliance screening failed: " + err.message });
    }
  });

  // 8. System Admin Audit Log fetcher
  app.get("/api/admin/audit-logs", (_req: Request, res: Response) => {
    res.json(auditLogStore);
  });

  // Sandbox State Reset
  app.post("/api/sandbox/reset", (_req: Request, res: Response) => {
    try {
      // Clear and restore walletStore
      walletStore.length = 0;
      walletStore.push(
        { currency: "USD", balance: 14250.00, symbol: "$" },
        { currency: "EUR", balance: 350.00, symbol: "€" },
        { currency: "GBP", balance: 120.00, symbol: "£" }
      );

      // Restore transfers
      transferStore = [
        {
          id: "tx-1",
          referenceNumber: "TX-784918239",
          senderId: "user-current",
          senderName: "Sium Sahaye",
          beneficiaryId: "ben-1",
          beneficiaryName: "Aarav Sharma",
          sendAmount: 1200.00,
          sendCurrency: "USD",
          receiveAmount: 100140.00,
          receiveCurrency: "INR",
          exchangeRate: 83.45,
          transferFee: 2.99,
          paymentMethod: "wallet",
          payoutMethod: "bank_deposit",
          status: "completed",
          riskScore: 12,
          riskReasons: ["Standard transfer, familiar beneficiary"],
          kycRequired: false,
          kycStatus: "approved",
          createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
          estimatedDelivery: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
        },
        {
          id: "tx-2",
          referenceNumber: "TX-492019385",
          senderId: "user-current",
          senderName: "Sium Sahaye",
          beneficiaryId: "ben-3",
          beneficiaryName: "Amara Adebayo",
          sendAmount: 450.00,
          sendCurrency: "USD",
          receiveAmount: 666000.00,
          receiveCurrency: "NGN",
          exchangeRate: 1480.00,
          transferFee: 3.99,
          paymentMethod: "debit_card",
          payoutMethod: "mobile_wallet",
          status: "processing",
          riskScore: 24,
          riskReasons: ["Medium transfer amount", "Valid KYC on file"],
          kycRequired: false,
          kycStatus: "approved",
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          estimatedDelivery: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        }
      ];

      // Restore kycStore
      kycStore = {
        documentType: "passport",
        documentNumber: "US9876543A",
        fullName: "Sium Sahaye",
        dateOfBirth: "1992-05-14",
        country: "United States",
        address: "100 California St, San Francisco, CA 94111",
        selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
        documentFrontUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop",
        status: "approved",
        submittedAt: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(),
      };

      // Restore audit logs
      auditLogStore = [
        {
          id: "log-1",
          action: "USER_LOGIN",
          details: "User Sium Sahaye logged in from IP 192.168.1.45 (Device: Chrome macOS)",
          severity: "info",
          timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
        },
        {
          id: "log-2",
          action: "WALLET_FUNDED",
          details: "USD wallet funded with $5,000.00 via Bank ACH (Chase Bank ****1290)",
          severity: "info",
          timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
        }
      ];

      logAction("SYSTEM_RESET", "Sandbox database ledgers, compliance logs, and transaction stores successfully reset to default.", "warning");
      res.json({ success: true, message: "Sandbox state successfully restored to defaults." });
    } catch (err: any) {
      res.status(500).json({ error: "Reset failed: " + err.message });
    }
  });

  // 9. AI Smart Copilot Chatbot Handler
  app.post("/api/ai/support", async (req: Request, res: Response) => {
    try {
      const { history } = req.body;
      if (!history || !Array.isArray(history)) {
        res.status(400).json({ error: "Invalid history input format" });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        // Simple fallback chatbot responses
        const lastUserMsg = history[history.length - 1]?.text?.toLowerCase() || "";
        let reply = "Hello! I am your AI Remittance Copilot. (Note: Set GEMINI_API_KEY in secrets to activate real-time LLM suggestions!). ";
        if (lastUserMsg.includes("status") || lastUserMsg.includes("track")) {
          reply += `You have ${transferStore.length} active transfers on file. The latest is ${transferStore[0]?.referenceNumber || "None"} currently in [${transferStore[0]?.status || "no status"}] stage.`;
        } else if (lastUserMsg.includes("rate") || lastUserMsg.includes("fee")) {
          reply += "We offer premium transfer corridors to over 10 countries! For example, 1 USD delivers 83.45 INR or 1,480 NGN with standard flat network fees of $2.99 - $3.99.";
        } else {
          reply += "How can I help you manage your funds, review currency spreads, complete identity verification, or inspect your sending history today?";
        }
        res.json({ text: reply });
        return;
      }

      const activeTransfersContext = transferStore.map(t => {
        return `Ref: ${t.referenceNumber}, Dest: ${t.beneficiaryName} (${t.receiveCurrency}), Sent: $${t.sendAmount} USD, Delivered: ${t.receiveAmount} ${t.receiveCurrency}, Status: ${t.status}, Est. Arrival: ${t.estimatedDelivery}`;
      }).join("\n");

      const systemInstruction = `You are "RemitGuard AI", a friendly, ultra-professional customer experience and technical helper for an international money transfer company.
Your goal is to assist the user with their account questions, tracking status, how to unlock wallets, exchange rate explanations, or compliance updates.
Be accurate, secure, and helpful. Do not disclose secret admin passwords but feel free to advise them on how to optimize their transfer fees.

Below is the user's active transaction database for reference:
${activeTransfersContext}

Keep replies elegant, relatively concise, and structured in readable markdown format.`;

      const formattedContents = history.map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("AI Assistant Chat Failure:", err);
      res.status(500).json({ error: "AI Assistant failed: " + err.message });
    }
  });

  // 10. AI Smart Financial Insights & Recommendations
  app.post("/api/ai/insights", async (req: Request, res: Response) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        res.json({
          insights: "✨ Add a **GEMINI_API_KEY** in your Settings secrets to get bespoke, real-time AI spending analytics and fee optimization strategies!",
          predictions: [
            { day: "Mon", rate: 83.41, action: "HOLD" },
            { day: "Tue (Best)", rate: 83.58, action: "SEND_MAX" },
            { day: "Wed", rate: 83.45, action: "STABLE" },
            { day: "Thu", rate: 83.39, action: "HOLD" },
            { day: "Fri", rate: 83.43, action: "STABLE" }
          ]
        });
        return;
      }

      const systemInstruction = `You are a financial analyst specializing in foreign currency markets and money remittance trends.
Analyze the user's historical sending pattern (Aarav Sharma in India, Amara Adebayo in Nigeria) and deliver 3 highly concise, valuable remittance tips.
Also, forecast the relative weekly USD exchange rate pattern for India/Nigeria to assist the user on when to send money to maximize recipient payout.`;

      const userPrompt = `Provide quick tips and simple 5-day rate trend forecast recommendation for Sium Sahaye who regularly sends money to India (INR) and Nigeria (NGN). Keep feedback in beautiful structured markdown formatting. Return a JSON object with:
1. "insights": string (clean markdown format tips)
2. "predictions": array of 5 objects containing "day" (string), "rate" (predicted INR rate), and "action" (string, e.g. "HOLD", "SEND", "OPTIMAL")`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: { type: Type.STRING },
              predictions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING },
                    rate: { type: Type.NUMBER },
                    action: { type: Type.STRING }
                  },
                  required: ["day", "rate", "action"]
                }
              }
            },
            required: ["insights", "predictions"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("AI Insights failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static assets / Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] International Money Transfer Engine live on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Startup failed:", err);
  process.exit(1);
});
