import { useState } from 'react';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Transaction, Category } from '../types';
import {
  getTransactionsForMonth, calculateTotalByType, calculateByCategory,
  getMonthlyTrend, formatKRW, formatCompact,
} from '../utils/finance';
import MonthSelector from '../components/MonthSelector';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
}

export default function Dashboard({ transactions, categories, onDelete }: Props) {
  const [yearMonth, setYearMonth] = useState(format(new Date(), 'yyyy-MM'));

  const monthTx = getTransactionsForMonth(transactions, yearMonth);
  const totalIncome = calculateTotalByType(monthTx, 'income');
  const totalExpense = calculateTotalByType(monthTx, 'expense');
  const net = totalIncome - totalExpense;

  const expenseByCategory = calculateByCategory(
    monthTx.filter(t => t.type === 'expense'),
    categories
  );
  const maxExpense = Math.max(...expenseByCategory.map(c => c.total), 1);

  const trend = getMonthlyTrend(transactions, 6);

  const sortedTx = [...monthTx].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const grouped = sortedTx.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div>
      <div className="page-header">
        <h1>대시보드</h1>
      </div>

      <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">수입</div>
          <div className={`value income`}>{formatCompact(totalIncome)}</div>
        </div>
        <div className="summary-item">
          <div className="label">지출</div>
          <div className={`value expense`}>{formatCompact(totalExpense)}</div>
        </div>
        <div className="summary-item">
          <div className="label">순이익</div>
          <div className={`value ${net >= 0 ? 'net' : 'negative'}`}>
            {net >= 0 ? '+' : ''}{formatCompact(net)}
          </div>
        </div>
      </div>

      {trend.length > 0 && (
        <div className="card">
          <div className="card-title">월별 추이</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={formatCompact} />
              <Tooltip formatter={(value) => formatKRW(Number(value))} />
              <Bar dataKey="income" name="수입" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {expenseByCategory.length > 0 && (
        <div className="card">
          <div className="card-title">지출 카테고리별</div>
          {expenseByCategory.map(cat => (
            <div key={cat.categoryId} className="category-bar">
              <span className="icon">{cat.icon}</span>
              <span className="name">{cat.categoryName}</span>
              <div className="bar-container">
                <div
                  className="bar-fill expense"
                  style={{ width: `${(cat.total / maxExpense) * 100}%` }}
                />
              </div>
              <span className="amount">{formatCompact(cat.total)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">거래 내역</div>
        {sortedTx.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>이번 달 거래가 없습니다</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date} className="date-group">
              <div className="date-group-header">{date}</div>
              <ul className="transaction-list">
                {txs.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  return (
                    <li key={tx.id} className="transaction-item">
                      <div className="transaction-icon">{cat?.icon || '❓'}</div>
                      <div className="transaction-info">
                        <div className="name">{cat?.name || '알 수 없음'}</div>
                        <div className="detail">{tx.description || '-'}</div>
                      </div>
                      <div className={`transaction-amount ${tx.type}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatKRW(tx.amount)}
                      </div>
                      <button
                        className="transaction-delete"
                        onClick={() => onDelete(tx.id)}
                        title="삭제"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
