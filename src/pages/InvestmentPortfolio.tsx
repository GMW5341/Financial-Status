import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Investment } from '../types';
import { getInvestmentSummary, formatKRW, formatCompact } from '../utils/finance';

interface Props {
  investments: Investment[];
  onAdd: (inv: Omit<Investment, 'id' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<Investment>) => void;
  onDelete: (id: string) => void;
}

const INVEST_TYPES: { value: Investment['type']; label: string }[] = [
  { value: 'domestic_stock', label: '국내주식' },
  { value: 'foreign_stock', label: '해외주식' },
  { value: 'etf', label: 'ETF' },
  { value: 'bond', label: '채권' },
  { value: 'fund', label: '펀드' },
  { value: 'crypto', label: '암호화폐' },
  { value: 'savings', label: '예적금' },
  { value: 'other', label: '기타' },
];

const PIE_COLORS = ['#1B2A4A', '#C9A84C', '#10B981', '#EF4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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

export default function InvestmentPortfolio({ investments, onAdd, onUpdate, onDelete }: Props) {
  const summary = getInvestmentSummary(investments);

  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<Investment['type']>('domestic_stock');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !avgPrice || !currentPrice) return;

    onAdd({
      name,
      ticker,
      type,
      quantity: Number(quantity),
      avgPrice: Number(avgPrice),
      currentPrice: Number(currentPrice),
      note,
    });

    setName('');
    setTicker('');
    setQuantity('');
    setAvgPrice('');
    setCurrentPrice('');
    setNote('');
  };

  const handleUpdatePrice = (id: string) => {
    if (!editPrice) return;
    onUpdate(id, { currentPrice: Number(editPrice) });
    setEditingId(null);
    setEditPrice('');
  };

  const pieData = Object.entries(summary.byType)
    .map(([typeKey, value]) => ({
      name: INVEST_TYPES.find(t => t.value === typeKey)?.label || typeKey,
      value,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="page-header">
        <h1>투자현황</h1>
        <p>포트폴리오를 관리하고 투자 성과를 추적하세요</p>
      </div>

      {/* Summary */}
      <div className="summary-grid-4">
        <div className="summary-item">
          <div className="label">총 매입금액</div>
          <div className="value income">{formatCompact(summary.totalInvested)}</div>
        </div>
        <div className="summary-item">
          <div className="label">총 평가금액</div>
          <div className="value" style={{ color: 'var(--text)' }}>{formatCompact(summary.totalCurrent)}</div>
        </div>
        <div className="summary-item">
          <div className="label">평가손익</div>
          <div className={`value ${summary.totalPnL >= 0 ? 'net' : 'negative'}`}>
            {summary.totalPnL >= 0 ? '+' : ''}{formatCompact(summary.totalPnL)}
          </div>
        </div>
        <div className="summary-item">
          <div className="label">수익률</div>
          <div className={`value ${summary.returnRate >= 0 ? 'net' : 'negative'}`}>
            {summary.returnRate >= 0 ? '+' : ''}{summary.returnRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Asset Allocation Pie */}
      {pieData.length > 0 && (
        <div className="card">
          <div className="card-title">자산 배분</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Investment */}
      <div className="card">
        <div className="card-title">투자 종목 추가</div>
        <form onSubmit={handleAdd}>
          <div className="invest-form-grid">
            <div className="form-group">
              <label>종목명</label>
              <input type="text" placeholder="삼성전자" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>티커/코드</label>
              <input type="text" placeholder="005930" value={ticker} onChange={e => setTicker(e.target.value)} />
            </div>
            <div className="form-group">
              <label>유형</label>
              <select value={type} onChange={e => setType(e.target.value as Investment['type'])}>
                {INVEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>수량</label>
              <input type="number" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} min="0" step="any" />
            </div>
            <div className="form-group">
              <label>평균매입단가 (원)</label>
              <input type="number" placeholder="0" value={avgPrice} onChange={e => setAvgPrice(e.target.value)} min="0" step="any" />
            </div>
            <div className="form-group">
              <label>현재가 (원)</label>
              <input type="number" placeholder="0" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} min="0" step="any" />
            </div>
            <div className="form-group full-width">
              <label>메모 (선택)</label>
              <input type="text" placeholder="투자 메모" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={!name || !quantity || !avgPrice || !currentPrice}>
            추가하기
          </button>
        </form>
      </div>

      {/* Investment List */}
      <div className="card">
        <div className="card-title">보유 종목 ({investments.length})</div>
        {investments.length === 0 ? (
          <div className="empty-state">
            <div className="icon" style={{ opacity: 0.5 }}>{'  '}</div>
            <p>등록된 투자 종목이 없습니다</p>
          </div>
        ) : (
          investments.map(inv => {
            const invested = inv.quantity * inv.avgPrice;
            const current = inv.quantity * inv.currentPrice;
            const pnl = current - invested;
            const returnPct = invested > 0 ? (pnl / invested) * 100 : 0;
            const typeLabel = INVEST_TYPES.find(t => t.value === inv.type)?.label || inv.type;

            return (
              <div key={inv.id} className="invest-item">
                <div className="invest-item-header">
                  <div>
                    <span className="invest-item-name">{inv.name}</span>
                    {inv.ticker && <span className="invest-item-ticker">{inv.ticker}</span>}
                    <span className="asset-item type-badge" style={{ marginLeft: 8, display: 'inline' }}>{typeLabel}</span>
                  </div>
                  <div className="invest-item-right">
                    <div className="invest-item-value">
                      <div className="current">{formatKRW(current)}</div>
                      <div className={`pnl ${pnl >= 0 ? 'positive' : 'negative'}`}>
                        {pnl >= 0 ? '+' : ''}{formatCompact(pnl)} ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)
                      </div>
                    </div>
                    <button className="asset-item delete-btn" onClick={() => onDelete(inv.id)} title="삭제">
                      ✕
                    </button>
                  </div>
                </div>
                <div className="invest-item-meta">
                  <span>{inv.quantity}주</span>
                  <span>매입 {formatKRW(inv.avgPrice)}</span>
                  <span>현재 {formatKRW(inv.currentPrice)}</span>
                  {inv.note && <span style={{ color: 'var(--text-muted)' }}>{inv.note}</span>}
                </div>
                <div style={{ marginTop: 6 }}>
                  {editingId === inv.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number"
                        placeholder="새 현재가"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, width: 140, fontFamily: 'inherit' }}
                        min="0"
                        step="any"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdatePrice(inv.id)}
                        style={{ padding: '4px 10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        저장
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditPrice(''); }}
                        style={{ padding: '4px 10px', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(inv.id); setEditPrice(String(inv.currentPrice)); }}
                      style={{ padding: '3px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      현재가 수정
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
