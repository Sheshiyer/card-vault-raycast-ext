export interface BankInfo {
  name: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

export interface BankLogos {
  banks: {
    [key: string]: BankInfo;
  };
}

export interface Card {
  id: string;
  bankName: string;
  cardName: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cardType: "credit" | "debit";
  totalLimit?: number; // Total credit limit for credit cards
  currentBalance?: number; // Current balance/amount owed
  pendingBalance?: number; // Pending transactions not yet posted
  availableBalance?: number; // Calculated: totalLimit - currentBalance - pendingBalance
  lastUpdated?: string; // ISO timestamp of last balance update
  alertsEnabled?: boolean; // Whether to receive spending alerts
  alertThreshold?: number; // Percentage threshold for alerts (0-100)
  paymentDueDate?: string; // ISO date for upcoming payment due
  paymentDueAmount?: number; // Amount due for upcoming statement
  history?: BalanceSnapshot[]; // Historical balance snapshots for tracking
}

export interface CardFormData {
  bankName: string;
  cardName: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
  cardType: "credit" | "debit";
  totalLimit?: number; // Total credit limit for credit cards
  currentBalance?: number; // Current balance/amount owed
  pendingBalance?: number; // Pending transactions not yet posted
  availableBalance?: number; // Calculated: totalLimit - currentBalance - pendingBalance
  lastUpdated?: string; // ISO timestamp of last balance update
  alertsEnabled?: boolean; // Whether to receive spending alerts
  alertThreshold?: number; // Percentage threshold for alerts (0-100)
  paymentDueDate?: string; // ISO date for upcoming payment due
  paymentDueAmount?: number; // Amount due for upcoming statement
}

export interface BalanceSnapshot {
  timestamp: string;
  currentBalance?: number;
  pendingBalance?: number;
  availableBalance?: number;
}
