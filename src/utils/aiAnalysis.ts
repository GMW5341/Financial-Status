import type { Transaction, Category, Investment } from '../types';
import { getMonthlyTrend, calculateByCategory, getTransactionsForMonth, calculateTotalByType, getTotalRetainedEarnings } from './finance';
import { format } from 'date-fns';

export interface FinancialSummary {
  currentMonth: string;
  monthlyTrend: { month: string; income: number; expense: number; net: number }[];
  expenseByCategory: { name: string; amount: number; percentage: number }[];
  incomeByCategory: { name: string; amount: number; percentage: number }[];
  fixedVsVariable: { fixed: number; variable: number; unclassified: number };
  savingsRate: number;
  totalRetainedEarnings: number;
  investmentSummary?: { totalInvested: number; totalCurrent: number; returnRate: number; count: number };
}

export function buildFinancialSummary(
  transactions: Transaction[],
  categories: Category[],
  investments: Investment[],
): FinancialSummary {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthlyTrend = getMonthlyTrend(transactions, 6).map(m => ({
    month: m.month,
    income: m.income,
    expense: m.expense,
    net: m.net,
  }));

  const currentMonthTx = getTransactionsForMonth(transactions, currentMonth);
  const expenseTx = currentMonthTx.filter(t => t.type === 'expense');
  const incomeTx = currentMonthTx.filter(t => t.type === 'income');

  const totalExpense = calculateTotalByType(currentMonthTx, 'expense');
  const totalIncome = calculateTotalByType(currentMonthTx, 'income');

  const expenseByCategory = calculateByCategory(expenseTx, categories).map(c => ({
    name: c.categoryName,
    amount: c.total,
    percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
  }));

  const incomeByCategory = calculateByCategory(incomeTx, categories).map(c => ({
    name: c.categoryName,
    amount: c.total,
    percentage: totalIncome > 0 ? Math.round((c.total / totalIncome) * 100) : 0,
  }));

  const fixed = expenseTx.filter(t => t.costType === 'fixed').reduce((s, t) => s + t.amount, 0);
  const variable = expenseTx.filter(t => t.costType === 'variable').reduce((s, t) => s + t.amount, 0);
  const unclassified = totalExpense - fixed - variable;

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const totalRetainedEarnings = getTotalRetainedEarnings(transactions);

  let investmentSummary: FinancialSummary['investmentSummary'];
  if (investments.length > 0) {
    const totalInvested = investments.reduce((s, i) => s + i.quantity * i.avgPrice, 0);
    const totalCurrent = investments.reduce((s, i) => s + i.quantity * i.currentPrice, 0);
    investmentSummary = {
      totalInvested,
      totalCurrent,
      returnRate: totalInvested > 0 ? Math.round(((totalCurrent - totalInvested) / totalInvested) * 100) : 0,
      count: investments.length,
    };
  }

  return {
    currentMonth,
    monthlyTrend,
    expenseByCategory,
    incomeByCategory,
    fixedVsVariable: { fixed, variable, unclassified },
    savingsRate,
    totalRetainedEarnings,
    investmentSummary,
  };
}

const SYSTEM_PROMPT = `당신은 개인 재무 분석 전문가입니다.
사용자의 재무 데이터를 분석하여 실질적이고 구체적인 조언을 제공합니다.
반드시 한국어로 답변하세요.

응답 형식은 반드시 아래 JSON 형식을 따르세요 (마크다운 코드블록 없이 순수 JSON만):
{
  "score": 0-100 사이의 재무 건강 점수,
  "scoreLabel": "점수에 대한 한줄 평가",
  "vulnerabilities": [
    { "title": "취약점 제목", "description": "상세 설명", "severity": "high|medium|low" }
  ],
  "improvements": [
    { "title": "개선점 제목", "description": "상세 설명", "impact": "high|medium|low" }
  ],
  "actions": [
    { "title": "실행 가능한 액션", "description": "구체적인 방법" }
  ],
  "summary": "전체 재무 상황에 대한 2-3문장 요약"
}`;

export interface AnalysisResult {
  score: number;
  scoreLabel: string;
  vulnerabilities: { title: string; description: string; severity: 'high' | 'medium' | 'low' }[];
  improvements: { title: string; description: string; impact: 'high' | 'medium' | 'low' }[];
  actions: { title: string; description: string }[];
  summary: string;
}

export async function analyzeFinances(
  apiKey: string,
  summary: FinancialSummary,
): Promise<AnalysisResult> {
  const userMessage = `아래는 나의 최근 6개월 재무 데이터 요약입니다. 분석해주세요.

${JSON.stringify(summary, null, 2)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 401) throw new Error('API 키가 유효하지 않습니다. 설정에서 확인해주세요.');
    if (response.status === 429) throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    throw new Error(`API 오류 (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답을 파싱할 수 없습니다.');

  return JSON.parse(jsonMatch[0]) as AnalysisResult;
}
