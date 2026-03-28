export interface CompoundYearData {
  year: number;
  principal: number;      // 누적 투입 원금
  interest: number;       // 누적 복리 수익
  total: number;          // 총 자산
  scenarioPrincipal?: number;
  scenarioInterest?: number;
  scenarioTotal?: number;
}

export interface CompoundResult {
  data: CompoundYearData[];
  finalTotal: number;
  finalPrincipal: number;
  finalInterest: number;
  multiplier: number;
}

export function calculateCompoundInterest(
  initialAmount: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
): CompoundResult {
  const monthlyRate = annualRate / 100 / 12;
  const data: CompoundYearData[] = [];

  for (let y = 0; y <= years; y++) {
    const monthsElapsed = y * 12;
    const principal = initialAmount + monthlyContribution * monthsElapsed;

    if (y === 0) {
      data.push({ year: y, principal: initialAmount, interest: 0, total: initialAmount });
      continue;
    }

    // Recalculate from scratch for accuracy
    let bal = initialAmount;
    for (let m = 1; m <= monthsElapsed; m++) {
      bal = bal * (1 + monthlyRate) + monthlyContribution;
    }
    const interest = bal - principal;
    data.push({ year: y, principal, interest, total: bal });
  }

  const last = data[data.length - 1];
  return {
    data,
    finalTotal: last.total,
    finalPrincipal: last.principal,
    finalInterest: last.interest,
    multiplier: last.principal > 0 ? last.total / last.principal : 0,
  };
}

export function calculateWithScenario(
  initialAmount: number,
  monthlyContribution: number,
  extraMonthly: number,
  annualRate: number,
  years: number,
): CompoundYearData[] {
  const base = calculateCompoundInterest(initialAmount, monthlyContribution, annualRate, years);
  const scenario = calculateCompoundInterest(initialAmount, monthlyContribution + extraMonthly, annualRate, years);

  return base.data.map((d, i) => ({
    ...d,
    scenarioPrincipal: scenario.data[i].principal,
    scenarioInterest: scenario.data[i].interest,
    scenarioTotal: scenario.data[i].total,
  }));
}

// 특정 목표 금액 달성을 위해 필요한 추가 월 적립액 역산
export function calculateRequiredExtra(
  initialAmount: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
  targetAmount: number,
): number {
  // 현재 조건으로 최종 금액 계산
  const current = calculateCompoundInterest(initialAmount, monthlyContribution, annualRate, years);
  if (current.finalTotal >= targetAmount) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;

  // FV of annuity factor: ((1+r)^n - 1) / r
  // target = initial * (1+r)^n + (monthly + extra) * fvFactor
  // extra = (target - initial*(1+r)^n - monthly*fvFactor) / fvFactor

  if (monthlyRate === 0) {
    const remaining = targetAmount - initialAmount - monthlyContribution * totalMonths;
    return Math.max(0, Math.ceil(remaining / totalMonths));
  }

  const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
  const fvFactor = (compoundFactor - 1) / monthlyRate;
  const fvInitial = initialAmount * compoundFactor;
  const fvMonthly = monthlyContribution * fvFactor;
  const extra = (targetAmount - fvInitial - fvMonthly) / fvFactor;

  return Math.max(0, Math.ceil(extra));
}

// 마일스톤 도달 연도 계산
export interface Milestone {
  amount: number;
  label: string;
  year: number | null;       // base scenario
  scenarioYear: number | null; // extra savings scenario
}

const MILESTONE_AMOUNTS = [
  { amount: 10_000_000, label: '1천만' },
  { amount: 50_000_000, label: '5천만' },
  { amount: 100_000_000, label: '1억' },
  { amount: 500_000_000, label: '5억' },
  { amount: 1_000_000_000, label: '10억' },
];

export function getMilestones(data: CompoundYearData[]): Milestone[] {
  return MILESTONE_AMOUNTS
    .filter(m => {
      const maxBase = Math.max(...data.map(d => d.total));
      const maxScenario = Math.max(...data.map(d => d.scenarioTotal || 0));
      return m.amount <= Math.max(maxBase, maxScenario) * 1.5;
    })
    .map(m => {
      const baseHit = data.find(d => d.total >= m.amount);
      const scenarioHit = data.find(d => (d.scenarioTotal || 0) >= m.amount);
      return {
        amount: m.amount,
        label: m.label,
        year: baseHit ? baseHit.year : null,
        scenarioYear: scenarioHit ? scenarioHit.year : null,
      };
    });
}
