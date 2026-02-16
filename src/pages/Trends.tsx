import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Transaction, Category } from '../types';
import { getMonthlyTrend, getCategoryTrend, formatKRW, formatCompact } from '../utils/finance';

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function Trends({ transactions, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [months, setMonths] = useState(6);

  const trend = getMonthlyTrend(transactions, months);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const categoryTrend = selectedCategory
    ? getCategoryTrend(transactions, selectedCategory, months)
    : null;

  // Pie chart data for expense breakdown (all time in selected range)
  const expensePieData = expenseCategories
    .map(cat => {
      const total = transactions
        .filter(t => t.type === 'expense' && t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, value: total, icon: cat.icon };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="page-header">
        <h1>추이 분석</h1>
        <p>수입과 지출의 트렌드를 확인하세요</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>수입 vs 지출</div>
          <select
            value={months}
            onChange={e => setMonths(Number(e.target.value))}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
          >
            <option value={3}>3개월</option>
            <option value={6}>6개월</option>
            <option value={12}>12개월</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={formatCompact} />
            <Tooltip formatter={(value) => formatKRW(Number(value))} />
            <Line type="monotone" dataKey="income" name="수입" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="expense" name="지출" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="net" name="순이익" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {expensePieData.length > 0 && (
        <div className="card">
          <div className="card-title">지출 비율</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expensePieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {expensePieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatKRW(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="card-title">카테고리별 추이</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {[...expenseCategories, ...incomeCategories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 16,
                border: selectedCategory === cat.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: selectedCategory === cat.id ? 'rgba(37,99,235,0.05)' : 'white',
                cursor: 'pointer',
                fontSize: 12,
                color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {categoryTrend ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={categoryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={formatCompact} />
              <Tooltip formatter={(value) => formatKRW(Number(value))} />
              <Line type="monotone" dataKey="amount" name="금액" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ padding: 24 }}>
            <p>카테고리를 선택하면 추이를 확인할 수 있습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
