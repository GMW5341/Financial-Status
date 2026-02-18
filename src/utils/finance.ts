import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import type { Transaction, Category, Asset, Liability, Investment } from '../types';

export function getTransactionsForMonth(transactions: Transaction[], yearMonth: string): Transaction[] {
  return transactions.filter(t => t.date.startsWith(yearMonth));
}

export function getTransactionsForDateRange(
  transactions: Transaction[],
  start: string,
  end: string
): Transaction[] {
  return transactions.filter(t => t.date >= start && t.date <= end);
}

export function calculateTotalByType(
  transactions: Transaction[],
  type: 'income' | 'expense'
): number {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateByCategory(
  transactions: Transaction[],
  categories: Category[]
): { categoryId: string; categoryName: string; icon: string; total: number; type: string }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([categoryId, total]) => {
      const cat = categories.find(c => c.id === categoryId);
      return {
        categoryId,
        categoryName: cat?.name || '알 수 없음',
        icon: cat?.icon || '?',
        type: cat?.type || 'expense',
        total,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function getMonthlyTrend(
  transactions: Transaction[],
  monthsBack: number = 6
): { month: string; label: string; income: number; expense: number; net: number }[] {
  const now = new Date();
  const start = startOfMonth(subMonths(now, monthsBack - 1));
  const end = endOfMonth(now);
  const months = eachMonthOfInterval({ start, end });

  return months.map(m => {
    const yearMonth = format(m, 'yyyy-MM');
    const monthTx = getTransactionsForMonth(transactions, yearMonth);
    const income = calculateTotalByType(monthTx, 'income');
    const expense = calculateTotalByType(monthTx, 'expense');
    return {
      month: yearMonth,
      label: format(m, 'M월'),
      income,
      expense,
      net: income - expense,
    };
  });
}

export function getRetainedEarningsTrend(
  transactions: Transaction[],
  monthsBack: number = 12
): { month: string; label: string; retained: number; cumulative: number; savingsRate: number }[] {
  const now = new Date();
  const start = startOfMonth(subMonths(now, monthsBack - 1));
  const end = endOfMonth(now);
  const months = eachMonthOfInterval({ start, end });

  const startStr = format(start, 'yyyy-MM');
  const priorTx = transactions.filter(t => t.date < startStr + '-01');
  let cumulative = priorTx.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  return months.map(m => {
    const yearMonth = format(m, 'yyyy-MM');
    const monthTx = getTransactionsForMonth(transactions, yearMonth);
    const income = calculateTotalByType(monthTx, 'income');
    const expense = calculateTotalByType(monthTx, 'expense');
    const retained = income - expense;
    cumulative += retained;
    return {
      month: yearMonth,
      label: format(m, 'M월'),
      retained,
      cumulative,
      savingsRate: income > 0 ? (retained / income) * 100 : 0,
    };
  });
}

export function getTotalRetainedEarnings(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
}

export function getCategoryTrend(
  transactions: Transaction[],
  categoryId: string,
  monthsBack: number = 6
): { month: string; label: string; amount: number }[] {
  const now = new Date();
  const start = startOfMonth(subMonths(now, monthsBack - 1));
  const end = endOfMonth(now);
  const months = eachMonthOfInterval({ start, end });

  return months.map(m => {
    const yearMonth = format(m, 'yyyy-MM');
    const amount = transactions
      .filter(t => t.date.startsWith(yearMonth) && t.categoryId === categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    return { month: yearMonth, label: format(m, 'M월'), amount };
  });
}

export function getIncomeStatement(
  transactions: Transaction[],
  categories: Category[],
  yearMonth: string
) {
  const monthTx = getTransactionsForMonth(transactions, yearMonth);
  const incomeTx = monthTx.filter(t => t.type === 'income');
  const expenseTx = monthTx.filter(t => t.type === 'expense');

  const incomeByCategory = calculateByCategory(incomeTx, categories);
  const expenseByCategory = calculateByCategory(expenseTx, categories);

  const totalIncome = calculateTotalByType(monthTx, 'income');
  const totalExpense = calculateTotalByType(monthTx, 'expense');

  return {
    yearMonth,
    totalIncome,
    totalExpense,
    netIncome: totalIncome - totalExpense,
    incomeByCategory,
    expenseByCategory,
    operatingMargin: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
  };
}

export function getBalanceSheet(assets: Asset[], liabilities: Liability[]) {
  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    assets,
    liabilities,
    debtRatio: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0,
  };
}

export function getInvestmentSummary(investments: Investment[]) {
  const totalInvested = investments.reduce((sum, i) => sum + i.quantity * i.avgPrice, 0);
  const totalCurrent = investments.reduce((sum, i) => sum + i.quantity * i.currentPrice, 0);
  const totalPnL = totalCurrent - totalInvested;
  const returnRate = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const byType = investments.reduce((acc, inv) => {
    const value = inv.quantity * inv.currentPrice;
    acc[inv.type] = (acc[inv.type] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalInvested,
    totalCurrent,
    totalPnL,
    returnRate,
    byType,
    count: investments.length,
  };
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 100_000_000) {
    return (amount / 100_000_000).toFixed(1) + '억';
  }
  if (Math.abs(amount) >= 10_000) {
    return (amount / 10_000).toFixed(0) + '만';
  }
  return new Intl.NumberFormat('ko-KR').format(amount);
}
