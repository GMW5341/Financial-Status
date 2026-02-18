import { useState, useMemo } from 'react';
import type { Transaction, Category, Account } from '../types';
import { formatKRW, formatCompact } from '../utils/finance';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onDelete: (id: string) => void;
}

function downloadCSV(transactions: Transaction[], categories: Category[], accounts: Account[]) {
  const BOM = '\uFEFF';
  const header = ['날짜', '이름', '유형', '고정/변동', '카테고리', '계좌', '금액', '메모'];
  const rows = transactions.map(tx => {
    const cat = categories.find(c => c.id === tx.categoryId);
    const acc = accounts.find(a => a.id === tx.accountId);
    return [
      tx.date,
      tx.name,
      tx.type === 'income' ? '수입' : '지출',
      tx.costType === 'fixed' ? '고정비' : tx.costType === 'variable' ? '변동비' : '',
      cat?.name || '',
      acc?.name || '',
      String(tx.amount),
      tx.description,
    ];
  });
  const csv = BOM + [header, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `거래내역_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionHistory({ transactions, categories, accounts, onDelete }: Props) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [costTypeFilter, setCostTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return transactions
      .filter(tx => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (costTypeFilter !== 'all') {
          if (costTypeFilter === 'fixed' && tx.costType !== 'fixed') return false;
          if (costTypeFilter === 'variable' && tx.costType !== 'variable') return false;
          if (costTypeFilter === 'none' && tx.costType) return false;
        }
        if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
        if (accountFilter !== 'all' && tx.accountId !== accountFilter) return false;
        if (dateFrom && tx.date < dateFrom) return false;
        if (dateTo && tx.date > dateTo) return false;
        if (search) {
          const q = search.toLowerCase();
          const cat = categories.find(c => c.id === tx.categoryId);
          if (
            !tx.name.toLowerCase().includes(q) &&
            !tx.description.toLowerCase().includes(q) &&
            !(cat?.name.toLowerCase().includes(q))
          ) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, typeFilter, costTypeFilter, categoryFilter, accountFilter, dateFrom, dateTo, search, categories]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const filteredCategoryOptions = typeFilter === 'income' ? incomeCategories
    : typeFilter === 'expense' ? expenseCategories
    : categories;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>거래내역</h1>
            <p>모든 거래를 확인하고 필터링하세요</p>
          </div>
          <button className="btn btn-primary btn-sm btn-icon" onClick={() => downloadCSV(filtered, categories, accounts)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV 다운로드
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="form-group">
            <label>검색</label>
            <input type="text" placeholder="이름, 메모, 카테고리" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="form-group">
            <label>유형</label>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCategoryFilter('all'); }}>
              <option value="all">전체</option>
              <option value="income">수입</option>
              <option value="expense">지출</option>
            </select>
          </div>
          <div className="form-group">
            <label>비용구분</label>
            <select value={costTypeFilter} onChange={e => setCostTypeFilter(e.target.value)}>
              <option value="all">전체</option>
              <option value="fixed">고정비</option>
              <option value="variable">변동비</option>
              <option value="none">미분류</option>
            </select>
          </div>
          <div className="form-group">
            <label>카테고리</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">전체</option>
              {filteredCategoryOptions.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          {accounts.length > 0 && (
            <div className="form-group">
              <label>계좌</label>
              <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)}>
                <option value="all">전체</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>시작일</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label>종료일</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="tx-table-wrap">
          <table className="tx-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>이름</th>
                <th>유형</th>
                <th>구분</th>
                <th>카테고리</th>
                {accounts.length > 0 && <th>계좌</th>}
                <th style={{ textAlign: 'right' }}>금액</th>
                <th>메모</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={accounts.length > 0 ? 9 : 8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>거래 내역이 없습니다</td></tr>
              ) : (
                filtered.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const acc = accounts.find(a => a.id === tx.accountId);
                  return (
                    <tr key={tx.id}>
                      <td>{tx.date}</td>
                      <td style={{ fontWeight: 500 }}>{tx.name}</td>
                      <td><span className={`type-pill ${tx.type}`}>{tx.type === 'income' ? '수입' : '지출'}</span></td>
                      <td>
                        {tx.costType === 'fixed' && <span className="type-pill" style={{ background: 'rgba(139,92,246,0.08)', color: '#8b5cf6' }}>고정</span>}
                        {tx.costType === 'variable' && <span className="type-pill" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>변동</span>}
                      </td>
                      <td>{cat ? `${cat.icon} ${cat.name}` : '-'}</td>
                      {accounts.length > 0 && <td>{acc ? `${acc.icon} ${acc.name}` : '-'}</td>}
                      <td className={`amount-col ${tx.type === 'income' ? 'type-income' : 'type-expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatKRW(tx.amount)}
                      </td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</td>
                      <td>
                        <button className="transaction-delete" onClick={() => onDelete(tx.id)} title="삭제">✕</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>{filtered.length}건</span>
          <div className="table-footer-stats">
            <span style={{ color: 'var(--primary)' }}>수입 {formatCompact(totalIncome)}</span>
            <span style={{ color: 'var(--danger)' }}>지출 {formatCompact(totalExpense)}</span>
            <span style={{ fontWeight: 600 }}>순 {formatCompact(totalIncome - totalExpense)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
