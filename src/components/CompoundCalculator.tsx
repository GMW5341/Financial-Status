import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { calculateWithScenario, calculateRequiredExtra, getMilestones } from '../utils/compound';
import { formatCompact, formatKRW } from '../utils/finance';

interface Props {
  defaultInitial: number;
  defaultMonthly: number;
}

function CompoundTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}년차</div>
      <div className="chart-tooltip-item">
        <span className="chart-tooltip-dot" style={{ background: '#1B2A4A' }} />
        <span className="chart-tooltip-name">기본</span>
        <span className="chart-tooltip-value">{formatKRW(Math.round(d.total))}</span>
      </div>
      {d.scenarioTotal != null && d.scenarioTotal !== d.total && (
        <div className="chart-tooltip-item">
          <span className="chart-tooltip-dot" style={{ background: '#C9A84C' }} />
          <span className="chart-tooltip-name">추가 절약</span>
          <span className="chart-tooltip-value">{formatKRW(Math.round(d.scenarioTotal))}</span>
        </div>
      )}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: 6, paddingTop: 6, fontSize: 11, opacity: 0.7 }}>
        원금 {formatCompact(Math.round(d.principal))}원 / 수익 {formatCompact(Math.round(d.interest))}원
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 14, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
  background: 'var(--bg-card)', width: '100%', textAlign: 'right',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4,
};

const sliderStyle: React.CSSProperties = {
  width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginTop: 4,
};

export default function CompoundCalculator({ defaultInitial, defaultMonthly }: Props) {
  const [initial, setInitial] = useState(Math.max(0, defaultInitial));
  const [monthly, setMonthly] = useState(Math.max(0, defaultMonthly));
  const [rate, setRate] = useState(7.0);
  const [years, setYears] = useState(20);
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [targetAmount, setTargetAmount] = useState(100_000_000);
  const [showMilestoneCalc, setShowMilestoneCalc] = useState(false);

  const data = useMemo(
    () => calculateWithScenario(initial, monthly, extraMonthly, rate, years),
    [initial, monthly, extraMonthly, rate, years]
  );

  const milestones = useMemo(() => getMilestones(data), [data]);

  const requiredExtra = useMemo(
    () => calculateRequiredExtra(initial, monthly, rate, years, targetAmount),
    [initial, monthly, rate, years, targetAmount]
  );

  const last = data[data.length - 1];
  const finalTotal = last.total;
  const finalPrincipal = last.principal;
  const finalInterest = last.interest;
  const multiplier = finalPrincipal > 0 ? finalTotal / finalPrincipal : 0;

  const scenarioFinal = last.scenarioTotal || finalTotal;
  const scenarioDiff = scenarioFinal - finalTotal;

  // Y축 최대값에 맞는 마일스톤 필터
  const chartMax = Math.max(...data.map(d => Math.max(d.total, d.scenarioTotal || 0)));
  const visibleMilestones = milestones.filter(m => m.amount <= chartMax * 1.1);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>복리 계산기</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>절약의 장기적 효과를 시뮬레이션합니다</span>
      </div>

      {/* Input Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={labelStyle}>초기 투자금</div>
          <input type="number" value={initial} onChange={e => setInitial(Math.max(0, Number(e.target.value)))}
            style={inputStyle} step={100000} />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textAlign: 'right' }}>
            {formatCompact(initial)}원
          </div>
        </div>
        <div>
          <div style={labelStyle}>월 적립액</div>
          <input type="number" value={monthly} onChange={e => setMonthly(Math.max(0, Number(e.target.value)))}
            style={inputStyle} step={50000} />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textAlign: 'right' }}>
            {formatCompact(monthly)}원/월
          </div>
        </div>
        <div>
          <div style={labelStyle}>연평균 수익률 ({rate}%)</div>
          <input type="number" value={rate} onChange={e => setRate(Math.max(0, Math.min(30, Number(e.target.value))))}
            style={inputStyle} step={0.1} min={0} max={30} />
          <input type="range" value={rate} onChange={e => setRate(Number(e.target.value))}
            style={sliderStyle} min={0} max={20} step={0.1} />
        </div>
        <div>
          <div style={labelStyle}>투자 기간 ({years}년)</div>
          <input type="number" value={years} onChange={e => setYears(Math.max(1, Math.min(50, Number(e.target.value))))}
            style={inputStyle} step={1} min={1} max={50} />
          <input type="range" value={years} onChange={e => setYears(Number(e.target.value))}
            style={sliderStyle} min={1} max={50} step={1} />
        </div>
        <div>
          <div style={labelStyle}>추가 절약 (시나리오)</div>
          <input type="number" value={extraMonthly} onChange={e => setExtraMonthly(Math.max(0, Number(e.target.value)))}
            style={inputStyle} step={50000} />
          <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, textAlign: 'right' }}>
            {extraMonthly > 0 ? `+${formatCompact(extraMonthly)}원/월` : '비교 없음'}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
        <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>최종 예상 자산</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{formatCompact(Math.round(finalTotal))}원</div>
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>총 투입 원금</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{formatCompact(Math.round(finalPrincipal))}원</div>
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>복리 수익</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{formatCompact(Math.round(finalInterest))}원</div>
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>수익 배율</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{multiplier.toFixed(1)}x</div>
        </div>
        {extraMonthly > 0 && (
          <div style={{ padding: '12px 14px', background: 'rgba(201,168,76,0.06)', borderRadius: 8, border: '1px solid rgba(201,168,76,0.2)' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 4 }}>시나리오 차이</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>+{formatCompact(Math.round(scenarioDiff))}원</div>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="compoundBase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="compoundScenario" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="compoundPrincipal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false}
            tickFormatter={(v: number) => `${v}년`} />
          <YAxis fontSize={11} tickLine={false} axisLine={false} width={60}
            tickFormatter={(v: number) => formatCompact(v)} />
          <Tooltip content={<CompoundTooltip />} />

          {/* Milestone reference lines */}
          {visibleMilestones.map(m => (
            <ReferenceLine key={m.amount} y={m.amount} stroke="var(--border)" strokeDasharray="6 4"
              label={{ value: m.label, position: 'left', fontSize: 10, fill: 'var(--text-muted)' }} />
          ))}

          {/* Principal area */}
          <Area type="monotone" dataKey="principal" name="원금" stroke="#94A3B8" strokeWidth={1.5}
            fill="url(#compoundPrincipal)" strokeDasharray="4 2" dot={false} />

          {/* Scenario area (behind base) */}
          {extraMonthly > 0 && (
            <Area type="monotone" dataKey="scenarioTotal" name="추가 절약" stroke="#C9A84C" strokeWidth={2}
              fill="url(#compoundScenario)" dot={false} />
          )}

          {/* Base total area */}
          <Area type="monotone" dataKey="total" name="기본" stroke="#1B2A4A" strokeWidth={2.5}
            fill="url(#compoundBase)" dot={{ r: 2, fill: '#1B2A4A' }} activeDot={{ r: 5, fill: '#1B2A4A' }} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Milestones Table */}
      {visibleMilestones.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>마일스톤 도달 예상</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {visibleMilestones.map(m => (
              <div key={m.amount} style={{
                padding: '8px 14px', borderRadius: 8, background: 'var(--bg)',
                border: m.year ? '1px solid var(--border)' : '1px dashed var(--border)',
                fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, opacity: m.year ? 1 : 0.5,
              }}>
                <span style={{ fontWeight: 700 }}>{m.label}</span>
                <span style={{ color: m.year ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {m.year != null ? `${m.year}년차` : `${years}년 내 미달성`}
                </span>
                {extraMonthly > 0 && m.scenarioYear != null && m.scenarioYear !== m.year && (
                  <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>
                    ({m.scenarioYear}년차)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestone Target Calculator */}
      <div style={{ marginTop: 16, padding: 14, background: 'var(--bg)', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={() => setShowMilestoneCalc(!showMilestoneCalc)}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
            목표 금액 달성 역산
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', transform: showMilestoneCalc ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>
        {showMilestoneCalc && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13 }}>목표:</span>
              <input type="number" value={targetAmount} onChange={e => setTargetAmount(Math.max(0, Number(e.target.value)))}
                style={{ ...inputStyle, width: 160 }} step={10000000} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({formatCompact(targetAmount)}원)</span>
            </div>
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
              {requiredExtra === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                  현재 조건으로 {years}년 안에 {formatCompact(targetAmount)}원을 달성할 수 있습니다!
                </p>
              ) : (
                <p style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>매월 {formatKRW(requiredExtra)}</span>
                  <span style={{ color: 'var(--text-secondary)' }}> 을(를) 추가로 적립하면 {years}년 후 </span>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatCompact(targetAmount)}원</span>
                  <span style={{ color: 'var(--text-secondary)' }}> 달성 가능</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
