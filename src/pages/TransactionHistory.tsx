import { useState, useMemo } from 'react';
import type { Transaction, TransactionType, CostType, Category, Account } from '../types';
import { formatKRW, formatCompact } from '../utils/finance';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
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

interface EditState {
  date: string;
  name: string;
  type: TransactionType;
  costType: CostType | '';
  categoryId: string;
  accountId: string;
  amount: string;
  description: string;
}

export default function TransactionHistory({ transactions, categories, accounts, onUpdate, onDelete }: Props) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [costTypeFilter, setCostTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({ date: '', name: '', type: 'expense', costType: '', categoryId: '', accountId: '', amount: '', description: '' });

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEdit({
      date: tx.date,
      name: tx.name,
      type: tx.type,
      costType: tx.costType || '',
      categoryId: tx.categoryId,
      accountId: tx.accountId || '',
      amount: String(tx.amount),
      description: tx.description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingId || !edit.name || !edit.amount || !edit.categoryId) return;
    onUpdate(editingId, {
      date: edit.date,
      name: edit.name,
      type: edit.type,
      costType: edit.type === 'expense' && edit.costType ? edit.costType as CostType : undefined,
      categoryId: edit.categoryId,
      accountId: edit.accountId || undefined,
      amount: Number(edit.amount),
      description: edit.description,
    });
    setEditingId(null);
  };

  const editCategories = categories.filter(c => c.type === edit.type);

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

  const colCount = accounts.length > 0 ? 10 : 9;

  const inputStyle: React.CSSProperties = { padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', width: '100%' };

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
                <tr><td colSpan={colCount} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>거래 내역이 없습니다</td></tr>
              ) : (
                filtered.map(tx => {
                  if (editingId === tx.id) {
                    return (
                      <tr key={tx.id} className="tx-edit-row">
                        <td><input type="date" value={edit.date} onChange={e => setEdit({ ...edit, date: e.target.value })} style={{ ...inputStyle, width: 130 }} /></td>
                        <td><input type="text" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} style={inputStyle} /></td>
                        <td>
                          <select value={edit.type} onChange={e => { const t = e.target.value as TransactionType; setEdit({ ...edit, type: t, costType: t === 'income' ? '' : edit.costType, categoryId: '' }); }} style={inputStyle}>
                            <option value="income">수입</option>
                            <option value="expense">지출</option>
                          </select>
                        </td>
                        <td>
                          {edit.type === 'expense' ? (
                            <select value={edit.costType} onChange={e => setEdit({ ...edit, costType: e.target.value as CostType | '' })} style={inputStyle}>
                              <option value="">-</option>
                              <option value="fixed">고정</option>
                              <option value="variable">변동</option>
                            </select>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>-</span>}
                        </td>
                        <td>
                          <select value={edit.categoryId} onChange={e => setEdit({ ...edit, categoryId: e.target.value })} style={inputStyle}>
                            <option value="">선택</option>
                            {editCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                            ))}
                          </select>
                        </td>
                        {accounts.length > 0 && (
                          <td>
                            <select value={edit.accountId} onChange={e => setEdit({ ...edit, accountId: e.target.value })} style={inputStyle}>
                              <option value="">-</option>
                              {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td><input type="number" value={edit.amount} onChange={e => setEdit({ ...edit, amount: e.target.value })} min="0" style={{ ...inputStyle, textAlign: 'right', width: 100 }} /></td>
                        <td><input type="text" value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} placeholder="메모" style={inputStyle} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={saveEdit} disabled={!edit.name || !edit.amount || !edit.categoryId}
                              style={{ padding: '3px 8px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: (!edit.name || !edit.amount || !edit.categoryId) ? 0.4 : 1 }}>
                              저장
                            </button>
                            <button onClick={cancelEdit}
                              style={{ padding: '3px 8px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                              취소
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

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
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="transaction-edit" onClick={() => startEdit(tx)} title="수정">✎</button>
                          <button className="transaction-delete" onClick={() => onDelete(tx.id)} title="삭제">✕</button>
                        </div>
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
