export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  categoryId: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'cash' | 'savings' | 'investment' | 'property' | 'other';
  amount: number;
  updatedAt: string;
}

export interface Liability {
  id: string;
  name: string;
  type: 'loan' | 'credit' | 'mortgage' | 'other';
  amount: number;
  updatedAt: string;
}

export interface Investment {
  id: string;
  name: string;
  ticker: string;
  type: 'domestic_stock' | 'foreign_stock' | 'etf' | 'bond' | 'fund' | 'crypto' | 'savings' | 'other';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  note: string;
  updatedAt: string;
}

export interface MonthlyData {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  byCategory: Record<string, number>;
}
