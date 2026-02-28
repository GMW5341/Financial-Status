import { useState } from 'react';
import type { Account, Category, TransactionType } from '../types';

interface Props {
  accounts: Account[];
  onAddAccount: (acc: Omit<Account, 'id' | 'createdAt'>) => void;
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
  categories: Category[];
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

const ACCOUNT_ICONS = ['🏦', '💳', '📱', '💰', '🏧', '🪙', '💵', '🏢'];
const CATEGORY_ICONS = ['💰', '💻', '📈', '💵', '📦', '🍚', '🚗', '🏠', '💡', '📱', '🛡️', '🏥', '📚', '🎬', '🛒', '☕', '📋', '📎', '🎮', '✈️', '🐶', '👕', '💊', '🎁', '🔧', '🏋️', '🍺', '🎨'];

export default function Settings({
  accounts, onAddAccount, onUpdateAccount, onDeleteAccount,
  categories, onAddCategory, onUpdateCategory, onDeleteCategory,
}: Props) {
  // Account state
  const [accName, setAccName] = useState('');
  const [accIcon, setAccIcon] = useState('🏦');
  const [editAccId, setEditAccId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccIcon, setEditAccIcon] = useState('');

  // Category state
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');
  const [catType, setCatType] = useState<TransactionType>('expense');
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');
  const [editCatType, setEditCatType] = useState<TransactionType>('expense');
  const [catTabFilter, setCatTabFilter] = useState<'all' | TransactionType>('all');

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    onAddAccount({ name: accName.trim(), icon: accIcon });
    setAccName('');
    setAccIcon('🏦');
  };

  const startEditAccount = (acc: Account) => {
    setEditAccId(acc.id);
    setEditAccName(acc.name);
    setEditAccIcon(acc.icon);
  };

  const saveEditAccount = (id: string) => {
    if (!editAccName.trim()) return;
    onUpdateAccount(id, { name: editAccName.trim(), icon: editAccIcon });
    setEditAccId(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onAddCategory({ name: catName.trim(), icon: catIcon, type: catType });
    setCatName('');
    setCatIcon('📦');
  };

  const startEditCategory = (cat: Category) => {
    setEditCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
    setEditCatType(cat.type);
  };

  const saveEditCategory = (id: string) => {
    if (!editCatName.trim()) return;
    onUpdateCategory(id, { name: editCatName.trim(), icon: editCatIcon, type: editCatType });
    setEditCatId(null);
  };

  const filteredCategories = catTabFilter === 'all' ? categories : categories.filter(c => c.type === catTabFilter);

  const inlineInputStyle: React.CSSProperties = { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' };

  return (
    <div>
      <div className="page-header">
        <h1>설정</h1>
        <p>카테고리, 계좌 및 기본 설정을 관리하세요</p>
      </div>

      {/* Category Section */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, marginTop: 4 }}>카테고리 관리</h2>
      <div className="grid-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="card-title">카테고리 추가</div>
          <form onSubmit={handleAddCategory}>
            <div className="form-group">
              <label>유형</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setCatType('expense')}
                  style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: catType === 'expense' ? '2px solid var(--danger)' : '1px solid var(--border)', background: catType === 'expense' ? 'rgba(239,68,68,0.04)' : 'var(--bg-card)', color: catType === 'expense' ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  지출
                </button>
                <button type="button" onClick={() => setCatType('income')}
                  style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: catType === 'income' ? '2px solid var(--primary)' : '1px solid var(--border)', background: catType === 'income' ? 'rgba(27,42,74,0.04)' : 'var(--bg-card)', color: catType === 'income' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  수입
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>아이콘</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {CATEGORY_ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setCatIcon(ic)}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: catIcon === ic ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: catIcon === ic ? 'rgba(27,42,74,0.04)' : 'var(--bg-card)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>카테고리 이름</label>
              <input type="text" placeholder="예: 식비, 월급, 교통비" value={catName} onChange={e => setCatName(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!catName.trim()}>추가하기</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>등록된 카테고리 ({categories.length})</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'expense', 'income'] as const).map(tab => (
                <button key={tab} onClick={() => setCatTabFilter(tab)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    border: catTabFilter === tab ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    background: catTabFilter === tab ? 'rgba(27,42,74,0.04)' : 'var(--bg-card)',
                    color: catTabFilter === tab ? 'var(--primary)' : 'var(--text-muted)',
                  }}>
                  {tab === 'all' ? '전체' : tab === 'expense' ? '지출' : '수입'}
                </button>
              ))}
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>카테고리가 없습니다</p>
            </div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {filteredCategories.map(cat => (
                <div key={cat.id} className="account-item">
                  {editCatId === cat.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                      <select value={editCatType} onChange={e => setEditCatType(e.target.value as TransactionType)}
                        style={{ ...inlineInputStyle, width: 72, fontSize: 12 }}>
                        <option value="expense">지출</option>
                        <option value="income">수입</option>
                      </select>
                      <select value={editCatIcon} onChange={e => setEditCatIcon(e.target.value)}
                        style={{ ...inlineInputStyle, width: 52, fontSize: 16 }}>
                        {CATEGORY_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                      <input type="text" value={editCatName} onChange={e => setEditCatName(e.target.value)}
                        style={{ ...inlineInputStyle, flex: 1, minWidth: 80 }} autoFocus />
                      <button onClick={() => saveEditCategory(cat.id)}
                        style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
                      <button onClick={() => setEditCatId(null)}
                        style={{ padding: '6px 12px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                    </div>
                  ) : (
                    <>
                      <span className="account-icon">{cat.icon}</span>
                      <span className="account-name" style={{ flex: 1 }}>
                        {cat.name}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                          {cat.type === 'income' ? '수입' : '지출'}
                        </span>
                      </span>
                      <div className="account-actions">
                        <button onClick={() => startEditCategory(cat)} title="수정"
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: '4px 6px', opacity: 0.5, transition: 'opacity 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
                          ✎
                        </button>
                        <button onClick={() => onDeleteCategory(cat.id)} title="삭제"
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '4px 6px', opacity: 0.4, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Section */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>계좌 관리</h2>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">계좌 추가</div>
          <form onSubmit={handleAddAccount}>
            <div className="form-group">
              <label>아이콘</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ACCOUNT_ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setAccIcon(ic)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: accIcon === ic ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: accIcon === ic ? 'rgba(27,42,74,0.04)' : 'var(--bg-card)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>계좌 이름</label>
              <input type="text" placeholder="예: 국민은행, 토스뱅크, 카카오뱅크" value={accName} onChange={e => setAccName(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!accName.trim()}>추가하기</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">등록된 계좌 ({accounts.length})</div>
          {accounts.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>등록된 계좌가 없습니다</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>계좌를 추가하면 거래 기록 시 어떤 계좌에서 이체되었는지 추적할 수 있습니다</p>
            </div>
          ) : (
            accounts.map(acc => (
              <div key={acc.id} className="account-item">
                {editAccId === acc.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                    <select value={editAccIcon} onChange={e => setEditAccIcon(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 16, fontFamily: 'inherit', width: 52 }}>
                      {ACCOUNT_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                    <input type="text" value={editAccName} onChange={e => setEditAccName(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }} autoFocus />
                    <button onClick={() => saveEditAccount(acc.id)}
                      style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
                    <button onClick={() => setEditAccId(null)}
                      style={{ padding: '6px 12px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                  </div>
                ) : (
                  <>
                    <span className="account-icon">{acc.icon}</span>
                    <span className="account-name">{acc.name}</span>
                    <div className="account-actions">
                      <button onClick={() => startEditAccount(acc)} title="수정"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: '4px 6px', opacity: 0.5, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
                        ✎
                      </button>
                      <button onClick={() => onDeleteAccount(acc.id)} title="삭제"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: '4px 6px', opacity: 0.4, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
