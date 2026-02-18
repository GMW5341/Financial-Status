import { useState } from 'react';
import type { Account } from '../types';

interface Props {
  accounts: Account[];
  onAddAccount: (acc: Omit<Account, 'id' | 'createdAt'>) => void;
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
}

const ACCOUNT_ICONS = ['🏦', '💳', '📱', '💰', '🏧', '🪙', '💵', '🏢'];

export default function Settings({ accounts, onAddAccount, onUpdateAccount, onDeleteAccount }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏦');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddAccount({ name: name.trim(), icon });
    setName('');
    setIcon('🏦');
  };

  const startEdit = (acc: Account) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditIcon(acc.icon);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateAccount(id, { name: editName.trim(), icon: editIcon });
    setEditingId(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1>설정</h1>
        <p>계좌 및 기본 설정을 관리하세요</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">계좌 추가</div>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>아이콘</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ACCOUNT_ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setIcon(ic)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: icon === ic ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: icon === ic ? 'rgba(27,42,74,0.04)' : 'var(--bg-card)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>계좌 이름</label>
              <input type="text" placeholder="예: 국민은행, 토스뱅크, 카카오뱅크" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>추가하기</button>
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
                {editingId === acc.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                    <select value={editIcon} onChange={e => setEditIcon(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 16, fontFamily: 'inherit', width: 52 }}>
                      {ACCOUNT_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }} autoFocus />
                    <button onClick={() => saveEdit(acc.id)}
                      style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
                    <button onClick={() => setEditingId(null)}
                      style={{ padding: '6px 12px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                  </div>
                ) : (
                  <>
                    <span className="account-icon">{acc.icon}</span>
                    <span className="account-name">{acc.name}</span>
                    <div className="account-actions">
                      <button onClick={() => startEdit(acc)} title="수정"
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
