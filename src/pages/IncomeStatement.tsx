import { useState } from 'react';
import { format } from 'date-fns';
import type { Transaction, Category } from '../types';
import { getIncomeStatement, formatKRW } from '../utils/finance';
import MonthSelector from '../components/MonthSelector';

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

export default function IncomeStatement({ transactions, categories }: Props) {
  const [yearMonth, setYearMonth] = useState(format(new Date(), 'yyyy-MM'));

  const stmt = getIncomeStatement(transactions, categories, yearMonth);

  return (
    <div>
      <div className="page-header">
        <h1>손익계산서</h1>
        <p>나라는 기업의 월간 손익을 확인하세요</p>
      </div>

      <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      <div className="card">
        <div className="metric-card">
          <div>
            <div className="metric-label">영업이익률</div>
            <div className="metric-value" style={{ color: stmt.operatingMargin >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {stmt.operatingMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="statement-table">
          <thead>
            <tr>
              <th>항목</th>
              <th className="amount-col">금액</th>
            </tr>
          </thead>
          <tbody>
            {/* 매출 (수입) */}
            <tr className="subtotal-row">
              <td>I. 매출 (수입)</td>
              <td className="amount-col">{formatKRW(stmt.totalIncome)}</td>
            </tr>
            {stmt.incomeByCategory.map(cat => (
              <tr key={cat.categoryId}>
                <td className="indent">{cat.icon} {cat.categoryName}</td>
                <td className="amount-col">{formatKRW(cat.total)}</td>
              </tr>
            ))}
            {stmt.incomeByCategory.length === 0 && (
              <tr>
                <td className="indent" colSpan={2} style={{ color: 'var(--text-muted)' }}>
                  수입 내역 없음
                </td>
              </tr>
            )}

            {/* 매출원가 (지출) */}
            <tr className="subtotal-row">
              <td>II. 비용 (지출)</td>
              <td className="amount-col" style={{ color: 'var(--danger)' }}>
                {formatKRW(stmt.totalExpense)}
              </td>
            </tr>
            {stmt.expenseByCategory.map(cat => (
              <tr key={cat.categoryId}>
                <td className="indent">{cat.icon} {cat.categoryName}</td>
                <td className="amount-col">{formatKRW(cat.total)}</td>
              </tr>
            ))}
            {stmt.expenseByCategory.length === 0 && (
              <tr>
                <td className="indent" colSpan={2} style={{ color: 'var(--text-muted)' }}>
                  지출 내역 없음
                </td>
              </tr>
            )}

            {/* 순이익 */}
            <tr className="total-row">
              <td>당기순이익</td>
              <td
                className="amount-col"
                style={{ color: stmt.netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {stmt.netIncome >= 0 ? '+' : ''}{formatKRW(stmt.netIncome)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
