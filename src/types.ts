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
  cvv: string;
  cardType: "credit" | "debit";
  cardLimit?: number; // Optional card limit field for credit cards
  weeklySpending?: number; // Current weekly spending amount
  weeklyLimit?: number; // Weekly spending limit
  weeklyUsage?: number; // Percentage usage of weekly limit (0-100)
  lastWeekUsage?: number; // Previous week's usage percentage
  alertsEnabled?: boolean; // Whether to receive spending alerts
  alertThreshold?: number; // Percentage threshold for alerts (0-100)
}

export interface CardFormData {
  bankName: string;
  cardName: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
  cardType: "credit" | "debit";
  cardLimit?: number; // Optional card limit field for credit cards
  weeklySpending?: number; // Current weekly spending amount
  weeklyLimit?: number; // Weekly spending limit
  weeklyUsage?: number; // Percentage usage of weekly limit (0-100)
  alertsEnabled?: boolean; // Whether to receive spending alerts
  alertThreshold?: number; // Percentage threshold for alerts (0-100)
}
