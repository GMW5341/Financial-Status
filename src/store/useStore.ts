import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, Category, Asset, Liability } from '../types';

const STORAGE_KEYS = {
  transactions: 'fs_transactions',
  categories: 'fs_categories',
  assets: 'fs_assets',
  liabilities: 'fs_liabilities',
};

const DEFAULT_CATEGORIES: Category[] = [
  // 수입 카테고리
  { id: 'salary', name: '급여', type: 'income', icon: '💰' },
  { id: 'freelance', name: '프리랜서', type: 'income', icon: '💻' },
  { id: 'investment-income', name: '투자수익', type: 'income', icon: '📈' },
  { id: 'side-income', name: '부수입', type: 'income', icon: '💵' },
  { id: 'other-income', name: '기타수입', type: 'income', icon: '📦' },
  // 지출 카테고리
  { id: 'food', name: '식비', type: 'expense', icon: '🍚' },
  { id: 'transport', name: '교통비', type: 'expense', icon: '🚗' },
  { id: 'housing', name: '주거비', type: 'expense', icon: '🏠' },
  { id: 'utilities', name: '공과금', type: 'expense', icon: '💡' },
  { id: 'communication', name: '통신비', type: 'expense', icon: '📱' },
  { id: 'insurance', name: '보험', type: 'expense', icon: '🛡️' },
  { id: 'medical', name: '의료비', type: 'expense', icon: '🏥' },
  { id: 'education', name: '교육비', type: 'expense', icon: '📚' },
  { id: 'entertainment', name: '여가/문화', type: 'expense', icon: '🎬' },
  { id: 'shopping', name: '쇼핑', type: 'expense', icon: '🛒' },
  { id: 'cafe', name: '카페/간식', type: 'expense', icon: '☕' },
  { id: 'subscription', name: '구독료', type: 'expense', icon: '📋' },
  { id: 'other-expense', name: '기타지출', type: 'expense', icon: '📎' },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useStore() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.transactions, [])
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromStorage(STORAGE_KEYS.categories, DEFAULT_CATEGORIES)
  );
  const [assets, setAssets] = useState<Asset[]>(() =>
    loadFromStorage(STORAGE_KEYS.assets, [])
  );
  const [liabilities, setLiabilities] = useState<Liability[]>(() =>
    loadFromStorage(STORAGE_KEYS.liabilities, [])
  );

  useEffect(() => saveToStorage(STORAGE_KEYS.transactions, transactions), [transactions]);
  useEffect(() => saveToStorage(STORAGE_KEYS.categories, categories), [categories]);
  useEffect(() => saveToStorage(STORAGE_KEYS.assets, assets), [assets]);
  useEffect(() => saveToStorage(STORAGE_KEYS.liabilities, liabilities), [liabilities]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    setTransactions(prev => [
      ...prev,
      { ...tx, id: uuidv4(), createdAt: new Date().toISOString() },
    ]);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...cat, id: uuidv4() }]);
  }, []);

  const addAsset = useCallback((asset: Omit<Asset, 'id' | 'updatedAt'>) => {
    setAssets(prev => [
      ...prev,
      { ...asset, id: uuidv4(), updatedAt: new Date().toISOString() },
    ]);
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets(prev =>
      prev.map(a => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    );
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  }, []);

  const addLiability = useCallback((liability: Omit<Liability, 'id' | 'updatedAt'>) => {
    setLiabilities(prev => [
      ...prev,
      { ...liability, id: uuidv4(), updatedAt: new Date().toISOString() },
    ]);
  }, []);

  const updateLiability = useCallback((id: string, updates: Partial<Liability>) => {
    setLiabilities(prev =>
      prev.map(l => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
    );
  }, []);

  const deleteLiability = useCallback((id: string) => {
    setLiabilities(prev => prev.filter(l => l.id !== id));
  }, []);

  return {
    transactions,
    categories,
    assets,
    liabilities,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    addCategory,
    addAsset,
    updateAsset,
    deleteAsset,
    addLiability,
    updateLiability,
    deleteLiability,
  };
}
