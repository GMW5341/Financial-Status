import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Transaction, Category, Investment } from '../types';
import { buildFinancialSummary, analyzeFinances } from '../utils/aiAnalysis';
import type { AnalysisResult } from '../utils/aiAnalysis';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  investments: Investment[];
  apiKey: string;
}

const SEVERITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: '높음' },
  medium: { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', label: '보통' },
  low: { bg: 'rgba(16,185,129,0.08)', color: 'var(--success)', label: '낮음' },
};

const IMPACT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  high: { bg: 'rgba(27,42,74,0.06)', color: 'var(--primary)', label: '효과 큼' },
  medium: { bg: 'rgba(201,168,76,0.08)', color: 'var(--accent)', label: '효과 보통' },
  low: { bg: 'var(--bg)', color: 'var(--text-muted)', label: '효과 작음' },
};

export default function AIAnalysis({ transactions, categories, investments, apiKey }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasData = transactions.length > 0;

  const handleAnalyze = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    try {
      const summary = buildFinancialSummary(transactions, categories, investments);
      const analysis = await analyzeFinances(apiKey, summary);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return 'var(--success)';
    if (score >= 40) return '#F59E0B';
    return 'var(--danger)';
  };

  return (
    <div>
      <div className="page-header">
        <h1>AI 재무 분석</h1>
        <p>Claude가 거래 데이터를 분석하여 취약점과 개선점을 제시합니다</p>
      </div>

      {!apiKey ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🔑</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>API 키가 필요합니다</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            설정 페이지에서 Anthropic API 키를 입력해주세요.
          </p>
          <button className="btn btn-primary btn-sm" style={{ width: 'auto', display: 'inline-block' }}
            onClick={() => navigate('/settings')}>
            설정으로 이동
          </button>
        </div>
      ) : !hasData ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>📊</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>거래 데이터가 없습니다</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            먼저 거래를 기록하면 AI가 분석할 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          {/* Analysis button */}
          <div className="card" style={{ textAlign: 'center', padding: 32, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              최근 6개월 거래 데이터를 기반으로 AI가 재무 상태를 분석합니다.
              <br />분석에는 약 10~20초가 소요됩니다.
            </p>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: 'auto', display: 'inline-block', padding: '12px 32px', fontSize: 14 }}
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? '분석 중...' : result ? '다시 분석하기' : '분석 시작'}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 32, marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }}>🤖</div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>AI가 재무 데이터를 분석하고 있습니다...</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>잠시만 기다려주세요</p>
              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }`}</style>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card" style={{ borderColor: 'var(--danger)', background: 'var(--danger-bg)', padding: 20, marginBottom: 16 }}>
              <p style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>분석 실패</p>
              <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div>
              {/* Score + Summary */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: `4px solid ${scoreColor(result.score)}`, flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: scoreColor(result.score), lineHeight: 1 }}>{result.score}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{result.scoreLabel}</div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.summary}</p>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                {/* Vulnerabilities */}
                <div className="card">
                  <div className="card-title" style={{ color: 'var(--danger)' }}>취약점</div>
                  {result.vulnerabilities.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>발견된 취약점이 없습니다</p>
                  ) : (
                    result.vulnerabilities.map((v, i) => {
                      const style = SEVERITY_STYLE[v.severity] || SEVERITY_STYLE.medium;
                      return (
                        <div key={i} style={{ padding: 14, background: 'var(--bg)', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${style.color}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{v.title}</span>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: style.bg, color: style.color }}>{style.label}</span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{v.description}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Improvements */}
                <div className="card">
                  <div className="card-title" style={{ color: 'var(--primary)' }}>개선점</div>
                  {result.improvements.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>제안할 개선점이 없습니다</p>
                  ) : (
                    result.improvements.map((imp, i) => {
                      const style = IMPACT_STYLE[imp.impact] || IMPACT_STYLE.medium;
                      return (
                        <div key={i} style={{ padding: 14, background: 'var(--bg)', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${style.color}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{imp.title}</span>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: style.bg, color: style.color }}>{style.label}</span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{imp.description}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Items */}
              {result.actions.length > 0 && (
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="card-title" style={{ color: 'var(--accent)' }}>실행 액션</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {result.actions.map((action, i) => (
                      <div key={i} style={{ padding: 14, background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{action.title}</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{action.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
