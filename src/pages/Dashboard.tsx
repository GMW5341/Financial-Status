import { useState } from 'react';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Transaction, Category } from '../types';
import {
  getTransactionsForMonth, calculateTotalByType, calculateByCategory,
  getMonthlyTrend, getRetainedEarningsTrend, getTotalRetainedEarnings,
  formatKRW, formatCompact,
} from '../utils/finance';
import MonthSelector from '../components/MonthSelector';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="chart-tooltip-item">
          <span className="chart-tooltip-dot" style={{ background: p.color || p.fill }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <span className="chart-tooltip-value">{formatKRW(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ transactions, categories, onDelete }: Props) {
  const [yearMonth, setYearMonth] = useState(format(new Date(), 'yyyy-MM'));

  const monthTx = getTransactionsForMonth(transactions, yearMonth);
  const totalIncome = calculateTotalByType(monthTx, 'income');
  const totalExpense = calculateTotalByType(monthTx, 'expense');
  const net = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((net / totalIncome) * 100) : 0;
  const totalRetained = getTotalRetainedEarnings(transactions);

  const expenseByCategory = calculateByCategory(
    monthTx.filter(t => t.type === 'expense'),
    categories
  );
  const maxExpense = Math.max(...expenseByCategory.map(c => c.total), 1);

  const trend = getMonthlyTrend(transactions, 6);
  const retainedTrend = getRetainedEarningsTrend(transactions, 8);

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

      {/* Retained Earnings Hero */}
      <div className="retained-highlight">
        <div className="label">누적 이익잉여금</div>
        <div className="big-value">
          {totalRetained >= 0 ? '+' : ''}{formatCompact(totalRetained)}원
        </div>
        <div className="sub-info">
          <div className="sub-info-item">
            <div className="sub-label">이번 달 순이익</div>
            <div className="sub-value">{net >= 0 ? '+' : ''}{formatCompact(net)}원</div>
          </div>
          <div className="sub-info-item">
            <div className="sub-label">절약률</div>
            <div className="sub-value">{savingsRate.toFixed(1)}%</div>
          </div>
          <div className="sub-info-item">
            <div className="sub-label">비용 통제</div>
            <div className="sub-value">{totalExpense > 0 ? formatCompact(totalExpense) + '원' : '-'}</div>
          </div>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">수입</div>
          <div className="value income">{formatCompact(totalIncome)}</div>
        </div>
        <div className="summary-item">
          <div className="label">지출</div>
          <div className="value expense">{formatCompact(totalExpense)}</div>
        </div>
        <div className="summary-item">
          <div className="label">순이익</div>
          <div className={`value ${net >= 0 ? 'net' : 'negative'}`}>
            {net >= 0 ? '+' : ''}{formatCompact(net)}
          </div>
        </div>
      </div>

      {/* Retained Earnings Trend */}
      {retainedTrend.length > 0 && (
        <div className="card">
          <div className="card-title">이익잉여금 추이</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={retainedTrend}>
              <defs>
                <linearGradient id="retainedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="누적 이익잉여금"
                stroke="#1B2A4A"
                strokeWidth={2}
                fill="url(#retainedGrad)"
                dot={{ r: 3, fill: '#1B2A4A' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Income vs Expense */}
      {trend.length > 0 && (
        <div className="card">
          <div className="card-title">월별 수입 vs 지출</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="income" name="수입" fill="#2D4A7A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="지출" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expense by Category */}
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

      {/* Transaction History */}
      <div className="card">
        <div className="card-title">거래 내역</div>
        {sortedTx.length === 0 ? (
          <div className="empty-state">
            <div className="icon">{'  '}</div>
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
                      <div className="transaction-icon">{cat?.icon || '?'}</div>
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
