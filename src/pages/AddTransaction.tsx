import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { TransactionType, CostType, Category, Account } from '../types';

interface Props {
  categories: Category[];
  accounts: Account[];
  onAdd: (tx: { date: string; type: TransactionType; costType?: CostType; categoryId: string; name: string; amount: number; description: string; accountId?: string }) => void;
}

const DRAFT_KEY = 'add-transaction-draft';

interface Draft {
  type: TransactionType;
  costType: CostType | '';
  date: string;
  categoryId: string;
  name: string;
  amount: string;
  description: string;
  accountId: string;
}

function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(draft: Draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

export default function AddTransaction({ categories, accounts, onAdd }: Props) {
  const navigate = useNavigate();
  const saved = loadDraft();

  const [type, setType] = useState<TransactionType>(saved?.type ?? 'expense');
  const [costType, setCostType] = useState<CostType | ''>(saved?.costType ?? '');
  const [date, setDate] = useState(saved?.date ?? format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState(saved?.categoryId ?? '');
  const [name, setName] = useState(saved?.name ?? '');
  const [amount, setAmount] = useState(saved?.amount ?? '');
  const [description, setDescription] = useState(saved?.description ?? '');
  const [accountId, setAccountId] = useState(saved?.accountId ?? '');

  const persistDraft = useCallback(() => {
    saveDraft({ type, costType, date, categoryId, name, amount, description, accountId });
  }, [type, costType, date, categoryId, name, amount, description, accountId]);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount || !name) return;

    onAdd({
      date,
      type,
      costType: type === 'expense' && costType ? costType : undefined,
      categoryId,
      name,
      amount: Number(amount),
      description,
      accountId: accountId || undefined,
    });

    setName('');
    setAmount('');
    setDescription('');
    setCategoryId('');
    setCostType('');
    setAccountId('');
    clearDraft();
    navigate('/');
  };

  return (
    <div>
      <div className="page-header">
        <h1>거래 기록</h1>
        <p>수입 또는 지출을 기록하세요</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="type-toggle">
            <button type="button" className={type === 'income' ? 'active-income' : ''} onClick={() => { setType('income'); setCategoryId(''); setCostType(''); }}>
              수입
            </button>
            <button type="button" className={type === 'expense' ? 'active-expense' : ''} onClick={() => { setType('expense'); setCategoryId(''); }}>
              지출
            </button>
          </div>

          <div className="add-tx-columns">
            {/* Left column */}
            <div className="add-tx-col">
              <div className="form-group">
                <label>이름</label>
                <input type="text" placeholder="거래 이름 (예: 점심식사)" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>날짜</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>

              {type === 'expense' && (
                <div className="form-group">
                  <label>비용 구분</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setCostType('fixed')}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: costType === 'fixed' ? '2px solid #8b5cf6' : '1px solid var(--border)', background: costType === 'fixed' ? 'rgba(139,92,246,0.06)' : 'var(--bg-card)', color: costType === 'fixed' ? '#8b5cf6' : 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      고정비
                    </button>
                    <button type="button" onClick={() => setCostType('variable')}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: costType === 'variable' ? '2px solid #f59e0b' : '1px solid var(--border)', background: costType === 'variable' ? 'rgba(245,158,11,0.06)' : 'var(--bg-card)', color: costType === 'variable' ? '#f59e0b' : 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      변동비
                    </button>
                  </div>
                </div>
              )}

              {accounts.length > 0 && (
                <div className="form-group">
                  <label>계좌</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} style={{ fontFamily: 'inherit' }}>
                    <option value="">선택 안 함</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>금액 (원)</label>
                <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label>메모 (선택)</label>
                <input type="text" placeholder="어디서, 무엇을" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>

            {/* Right column */}
            <div className="add-tx-col">
              <div className="form-group">
                <label>카테고리</label>
                <div className="category-grid">
                  {filteredCategories.map(cat => (
                    <div key={cat.id} className={`category-chip ${categoryId === cat.id ? 'selected' : ''}`} onClick={() => setCategoryId(cat.id)}>
                      <span className="icon">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={!categoryId || !amount || !name} style={{ marginTop: 8 }}>
            저장하기
          </button>
        </div>
      </form>
    </div>
  );
}
