import { useState } from 'react';
import type { Asset, Liability } from '../types';
import { getBalanceSheet, formatKRW } from '../utils/finance';

interface Props {
  assets: Asset[];
  liabilities: Liability[];
  onAddAsset: (a: Omit<Asset, 'id' | 'updatedAt'>) => void;
  onDeleteAsset: (id: string) => void;
  onAddLiability: (l: Omit<Liability, 'id' | 'updatedAt'>) => void;
  onDeleteLiability: (id: string) => void;
}

const ASSET_TYPES: { value: Asset['type']; label: string }[] = [
  { value: 'cash', label: '현금' },
  { value: 'savings', label: '예적금' },
  { value: 'investment', label: '투자' },
  { value: 'property', label: '부동산' },
  { value: 'other', label: '기타' },
];

const LIABILITY_TYPES: { value: Liability['type']; label: string }[] = [
  { value: 'loan', label: '대출' },
  { value: 'credit', label: '카드' },
  { value: 'mortgage', label: '주택담보' },
  { value: 'other', label: '기타' },
];

export default function BalanceSheet({
  assets, liabilities, onAddAsset, onDeleteAsset, onAddLiability, onDeleteLiability,
}: Props) {
  const bs = getBalanceSheet(assets, liabilities);

  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<Asset['type']>('cash');
  const [assetAmount, setAssetAmount] = useState('');

  const [liabName, setLiabName] = useState('');
  const [liabType, setLiabType] = useState<Liability['type']>('loan');
  const [liabAmount, setLiabAmount] = useState('');

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetAmount) return;
    onAddAsset({ name: assetName, type: assetType, amount: Number(assetAmount) });
    setAssetName('');
    setAssetAmount('');
  };

  const handleAddLiability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liabName || !liabAmount) return;
    onAddLiability({ name: liabName, type: liabType, amount: Number(liabAmount) });
    setLiabName('');
    setLiabAmount('');
  };

  return (
    <div>
      <div className="page-header">
        <h1>재무상태표</h1>
        <p>나라는 기업의 자산, 부채, 순자산을 확인하세요</p>
      </div>

      {/* Summary */}
      <div className="summary-grid">
        <div className="summary-item">
          <div className="label">총 자산</div>
          <div className="value income">{formatKRW(bs.totalAssets)}</div>
        </div>
        <div className="summary-item">
          <div className="label">총 부채</div>
          <div className="value expense">{formatKRW(bs.totalLiabilities)}</div>
        </div>
        <div className="summary-item">
          <div className="label">순자산 (자본)</div>
          <div className={`value ${bs.netWorth >= 0 ? 'net' : 'negative'}`}>
            {formatKRW(bs.netWorth)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="metric-card">
          <div>
            <div className="metric-label">부채비율</div>
            <div className="metric-value" style={{ color: bs.debtRatio > 100 ? 'var(--danger)' : 'var(--success)' }}>
              {bs.debtRatio.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Assets */}
      <div className="card">
        <div className="card-title">자산</div>
        <form className="inline-form" onSubmit={handleAddAsset}>
          <input
            type="text"
            placeholder="자산명"
            value={assetName}
            onChange={e => setAssetName(e.target.value)}
          />
          <select value={assetType} onChange={e => setAssetType(e.target.value as Asset['type'])}>
            {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            type="number"
            placeholder="금액"
            value={assetAmount}
            onChange={e => setAssetAmount(e.target.value)}
            min="0"
          />
          <button type="submit">추가</button>
        </form>

        {assets.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p>등록된 자산이 없습니다</p>
          </div>
        ) : (
          assets.map(a => (
            <div key={a.id} className="asset-item">
              <span className="name">{a.name}</span>
              <span className="type-badge">
                {ASSET_TYPES.find(t => t.value === a.type)?.label}
              </span>
              <span className="amount">{formatKRW(a.amount)}</span>
              <button className="delete-btn" onClick={() => onDeleteAsset(a.id)}>✕</button>
            </div>
          ))
        )}
      </div>

      {/* Liabilities */}
      <div className="card">
        <div className="card-title">부채</div>
        <form className="inline-form" onSubmit={handleAddLiability}>
          <input
            type="text"
            placeholder="부채명"
            value={liabName}
            onChange={e => setLiabName(e.target.value)}
          />
          <select value={liabType} onChange={e => setLiabType(e.target.value as Liability['type'])}>
            {LIABILITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            type="number"
            placeholder="금액"
            value={liabAmount}
            onChange={e => setLiabAmount(e.target.value)}
            min="0"
          />
          <button type="submit">추가</button>
        </form>

        {liabilities.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <p>등록된 부채가 없습니다</p>
          </div>
        ) : (
          liabilities.map(l => (
            <div key={l.id} className="asset-item">
              <span className="name">{l.name}</span>
              <span className="type-badge">
                {LIABILITY_TYPES.find(t => t.value === l.type)?.label}
              </span>
              <span className="amount" style={{ color: 'var(--danger)' }}>{formatKRW(l.amount)}</span>
              <button className="delete-btn" onClick={() => onDeleteLiability(l.id)}>✕</button>
            </div>
          ))
        )}
      </div>

      {/* Balance Sheet Table */}
      <div className="card">
        <div className="card-title">재무상태표</div>
        <table className="statement-table">
          <thead>
            <tr>
              <th>항목</th>
              <th className="amount-col">금액</th>
            </tr>
          </thead>
          <tbody>
            <tr className="subtotal-row">
              <td>I. 자산</td>
              <td className="amount-col">{formatKRW(bs.totalAssets)}</td>
            </tr>
            {assets.map(a => (
              <tr key={a.id}>
                <td className="indent">{a.name}</td>
                <td className="amount-col">{formatKRW(a.amount)}</td>
              </tr>
            ))}

            <tr className="subtotal-row">
              <td>II. 부채</td>
              <td className="amount-col" style={{ color: 'var(--danger)' }}>
                {formatKRW(bs.totalLiabilities)}
              </td>
            </tr>
            {liabilities.map(l => (
              <tr key={l.id}>
                <td className="indent">{l.name}</td>
                <td className="amount-col">{formatKRW(l.amount)}</td>
              </tr>
            ))}

            <tr className="total-row">
              <td>III. 순자산 (자본)</td>
              <td
                className="amount-col"
                style={{ color: bs.netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {formatKRW(bs.netWorth)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
