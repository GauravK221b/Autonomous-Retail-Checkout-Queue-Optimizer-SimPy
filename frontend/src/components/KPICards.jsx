import React from 'react';
import {
  TrendingDown,
  Users,
  Timer,
  Scale,
  Zap,
  Award
} from 'lucide-react';

export default function KPICards({ benchmarkData, currentQueues, serviceRates }) {
  const reductionPct = benchmarkData?.congestionReductionPct ?? 29.66;
  const randWait = benchmarkData?.randomTotalWait ?? 381;
  const optWait = benchmarkData?.optimizedTotalWait ?? 268;
  const waitDiff = benchmarkData?.difference ?? (randWait - optWait);

  const totalWaiting = currentQueues ? currentQueues.reduce((a, b) => a + b, 0) : 0;
  const optAvgWait = benchmarkData?.optAvgWaitPerStep ?? (optWait / 100).toFixed(2);
  const randAvgWait = benchmarkData?.randomAvgWaitPerStep ?? (randWait / 100).toFixed(2);
  const optVariance = benchmarkData?.optAvgVariance ?? 0.38;

  const cards = [
    {
      label: 'Congestion Reduction',
      value: `${reductionPct}%`,
      unit: 'Improvement',
      subtext: `+${waitDiff} wait-units prevented vs random`,
      icon: TrendingDown,
      accent: '#10b981',
      badge: 'RL Optimized',
      badgeClass: 'badge-success'
    },
    {
      label: 'Total Customer Wait-Units',
      value: optWait,
      unit: 'Wait-Units',
      subtext: `Baseline Random: ${randWait} units (100 steps)`,
      icon: Timer,
      accent: '#3b82f6',
      badge: `-29.7% Time`,
      badgeClass: 'badge-info'
    },
    {
      label: 'Average Queue / Step',
      value: optAvgWait,
      unit: 'Cust / Step',
      subtext: `Random load: ${randAvgWait} cust/step`,
      icon: Users,
      accent: '#8b5cf6',
      badge: 'High Flow',
      badgeClass: 'badge-success'
    },
    {
      label: 'Cashier Workload Variance',
      value: optVariance,
      unit: 'Var σ²',
      subtext: 'Lower variance = balanced cashier queues',
      icon: Scale,
      accent: '#f59e0b',
      badge: 'Balanced',
      badgeClass: 'badge-warning'
    }
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-card kpi-card"
            style={{ '--card-accent': card.accent }}
          >
            <div className="kpi-top">
              <span className="kpi-label">{card.label}</span>
              <div className="kpi-icon-box">
                <Icon size={20} />
              </div>
            </div>

            <div className="kpi-value-row">
              <span className="kpi-value">{card.value}</span>
              <span className="kpi-unit">{card.unit}</span>
            </div>

            <div className="kpi-subtext">
              <span className={`badge ${card.badgeClass}`}>{card.badge}</span>
              <span>{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
