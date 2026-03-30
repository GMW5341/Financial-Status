import { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Transaction, Category } from '../types';
import { getMonthlyTrend, getRetainedEarningsTrend, getCategoryTrend, formatKRW } from '../utils/finance';

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

const COLORS = ['#1B2A4A', '#EF4444', '#C9A84C', '#10B981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="chart-tooltip-item">
          <span className="chart-tooltip-dot" style={{ background: p.color || p.stroke || p.fill }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <span className="chart-tooltip-value">{formatKRW(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-dot" style={{ background: d.payload?.fill }} />
        <span className="chart-tooltip-name">{d.name}</span>
        <span className="chart-tooltip-value">{formatKRW(Number(d.value))}</span>
      </div>
    </div>
  );
}

export default function Trends({ transactions, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [months, setMonths] = useState(6);

  const trend = getMonthlyTrend(transactions, months);
  const retainedTrend = getRetainedEarningsTrend(transactions, months);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const categoryTrend = selectedCategory
    ? getCategoryTrend(transactions, selectedCategory, months)
    : null;

  const MAX_PIE_ITEMS = 7;
  const allExpenseData = expenseCategories
    .map(cat => {
      const total = transactions
        .filter(t => t.type === 'expense' && t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, value: total, icon: cat.icon };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalExpenseSum = allExpenseData.reduce((s, d) => s + d.value, 0);

  const topItems = allExpenseData.slice(0, MAX_PIE_ITEMS);
  const otherItems = allExpenseData.slice(MAX_PIE_ITEMS);
  const otherSum = otherItems.reduce((s, d) => s + d.value, 0);

  const expensePieData = otherSum > 0
    ? [...topItems, { name: `기타 (${otherItems.length}건)`, value: otherSum, icon: '📎' }]
    : topItems;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>추이 분석</h1>
            <p>수입 대비 비용 통제 현황을 확인하세요</p>
          </div>
          <select
            value={months}
            onChange={e => setMonths(Number(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit' }}
          >
            <option value={3}>3개월</option>
            <option value={6}>6개월</option>
            <option value={12}>12개월</option>
          </select>
        </div>
      </div>

      {/* Top charts side by side */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">수입 vs 지출</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="income" name="수입" stroke="#2D4A7A" strokeWidth={2} dot={{ r: 3, fill: '#2D4A7A' }} />
              <Line type="monotone" dataKey="expense" name="지출" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} />
              <Line type="monotone" dataKey="net" name="순이익" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2, fill: '#10B981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">절약률 추이</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={retainedTrend}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="chart-tooltip">
                      <div className="chart-tooltip-label">{label}</div>
                      <div className="chart-tooltip-item">
                        <span className="chart-tooltip-dot" style={{ background: '#C9A84C' }} />
                        <span className="chart-tooltip-name">절약률</span>
                        <span className="chart-tooltip-value">{Number(payload[0].value).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="savingsRate" name="절약률" stroke="#C9A84C" strokeWidth={2} fill="url(#savingsGrad)" dot={{ r: 3, fill: '#C9A84C' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom charts side by side */}
      <div className="grid-2">
        {expensePieData.length > 0 && (
          <div className="card">
            <div className="card-title">지출 비율</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Donut - no labels */}
              <div style={{ flexShrink: 0, width: 180, height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="value"
                      label={false} isAnimationActive={true}>
                      {expensePieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend list */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {expensePieData.map((d, i) => {
                  const pct = totalExpenseSum > 0 ? (d.value / totalExpenseSum) * 100 : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                        {d.icon} {d.name}
                      </span>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 3, minWidth: 30, overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: 3,
                          background: COLORS[i % COLORS.length], transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: 32, textAlign: 'right' }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-title">카테고리별 추이</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {[...expenseCategories, ...incomeCategories].map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                style={{ padding: '4px 10px', borderRadius: 16, border: selectedCategory === cat.id ? '2px solid var(--primary)' : '1px solid var(--border)', background: selectedCategory === cat.id ? 'rgba(27,42,74,0.04)' : 'white', cursor: 'pointer', fontSize: 12, color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-secondary)', fontFamily: 'inherit' }}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          {categoryTrend ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={categoryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="amount" name="금액" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>카테고리를 선택하면 추이를 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
