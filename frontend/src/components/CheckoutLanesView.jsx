import React from 'react';
import { User, CheckCircle2, AlertCircle, Zap, ArrowDown, UserPlus, Sparkles } from 'lucide-react';

const METRIC_LABELS = {
  q_learning: 'Q*(s, a)',
  sarsa: 'Q_sarsa(s, a)',
  bandit: 'UCB1 Score(s, a)',
  reinforce: 'Preference H(s, a)',
  a2c: 'Actor Advantage(s, a)',
  ppo: 'PPO Utility(s, a)',
  dqn: 'Q_dqn(s, a)',
  double_dqn: 'Q_ddqn(s, a)',
  ddpg: 'Q_critic(s, a)',
  shortest_queue: 'Heuristic Rank',
  random: 'Uniform Prob',
  manual: 'Manual'
};

export default function CheckoutLanesView({
  queues = [0, 0, 0],
  maxQueueLen = 5,
  serviceRates = [0.6, 0.4, 0.3],
  lastAction = null,
  lastServed = [false, false, false],
  qValues = [0, 0, 0],
  recommendedAction = 0,
  mode = 'q_learning',
  onManualDispatch
}) {
  const lanes = [
    {
      id: 0,
      name: 'Lane 0 (Fast Express)',
      speedLabel: 'High Speed',
      rate: serviceRates[0] ?? 0.6,
      color: '#10b981',
      colorBg: 'rgba(16, 185, 129, 0.15)',
      glow: 'rgba(16, 185, 129, 0.35)',
      description: 'Quick Scan / Basket Only'
    },
    {
      id: 1,
      name: 'Lane 1 (Standard Mid)',
      speedLabel: 'Medium Speed',
      rate: serviceRates[1] ?? 0.4,
      color: '#3b82f6',
      colorBg: 'rgba(59, 130, 246, 0.15)',
      glow: 'rgba(59, 130, 246, 0.35)',
      description: 'Standard Cart & Groceries'
    },
    {
      id: 2,
      name: 'Lane 2 (Slow Assist)',
      speedLabel: 'Low Speed',
      rate: serviceRates[2] ?? 0.3,
      color: '#f59e0b',
      colorBg: 'rgba(245, 158, 11, 0.15)',
      glow: 'rgba(245, 158, 11, 0.35)',
      description: 'Bulk Cart / Assisted Service'
    }
  ];

  const metricLabel = METRIC_LABELS[mode] || 'Value(s, a)';

  return (
    <div className="lanes-grid">
      {lanes.map((lane) => {
        const count = queues[lane.id] ?? 0;
        const isTarget = lastAction === lane.id;
        const isServed = lastServed[lane.id];
        const isRecommended = recommendedAction === lane.id;
        const qVal = qValues[lane.id] !== undefined ? qValues[lane.id] : 0;
        const isFull = count >= maxQueueLen;

        return (
          <div
            key={lane.id}
            className={`lane-card ${isTarget ? 'active-target' : ''}`}
            style={{
              borderColor: isTarget ? lane.color : isRecommended ? `${lane.color}88` : undefined,
              boxShadow: isTarget ? `0 0 25px ${lane.glow}` : undefined
            }}
          >
            {/* Lane Header */}
            <div className="lane-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    {lane.name}
                  </h3>
                  {isRecommended && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${lane.color}25`,
                        color: lane.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Recommended optimal action by current agent"
                    >
                      <Sparkles size={11} />
                      Target Pick
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {lane.description}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: lane.colorBg,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  color: lane.color,
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                μ = {lane.rate}
              </div>
            </div>

            {/* Cashier Station / Server Animation */}
            <div className="cashier-station">
              <div
                className={`cashier-avatar ${isServed ? 'cashier-serving' : ''}`}
                style={{
                  background: lane.colorBg,
                  border: `2px solid ${lane.color}`
                }}
              >
                <User size={24} color={lane.color} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Cashier Status
                  </span>
                  {isServed ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.78rem', fontWeight: 700 }}>
                      <CheckCircle2 size={13} /> Departure (-1 Cust)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {count > 0 ? 'Busy Processing' : 'Idle Waiting'}
                    </span>
                  )}
                </div>

                <div className="queue-progress-bar">
                  <div
                    className="queue-progress-fill"
                    style={{
                      width: `${(count / maxQueueLen) * 100}%`,
                      backgroundColor: count >= 4 ? '#ef4444' : count >= 3 ? '#f59e0b' : lane.color
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Animated Customer Queue Queue Slots */}
            <div className="queue-slot-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Active Queue: <strong style={{ color: 'var(--text-primary)' }}>{count}</strong> / {maxQueueLen}
                </span>
                {isFull && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700 }}>
                    <AlertCircle size={12} /> Counter Congested
                  </span>
                )}
              </div>

              <div className="customer-tokens">
                {Array.from({ length: maxQueueLen }).map((_, slotIdx) => {
                  const isOccupied = slotIdx < count;
                  return (
                    <div
                      key={slotIdx}
                      className={`customer-token ${isOccupied ? 'occupied' : 'empty'}`}
                      style={{
                        backgroundColor: isOccupied ? lane.color : 'transparent',
                        borderColor: isOccupied ? lane.color : 'var(--border-color)'
                      }}
                      title={isOccupied ? `Customer in position ${slotIdx + 1}` : 'Empty queue slot'}
                    >
                      {isOccupied && <User size={13} color="#ffffff" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Model Action Telemetry */}
            <div className="q-value-display">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color={lane.color} />
                <span style={{ fontSize: '0.78rem' }}>{metricLabel}:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {typeof qVal === 'number' ? qVal.toFixed(3) : qVal}
                </span>
                {isRecommended && (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    Optimal
                  </span>
                )}
              </div>
            </div>

            {/* Manual Dispatch Action Button */}
            {mode === 'manual' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onManualDispatch(lane.id)}
                disabled={isFull}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <UserPlus size={16} />
                Route to Lane {lane.id}
              </button>
            )}

            {/* Target indicator banner */}
            {isTarget && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px',
                  background: lane.colorBg,
                  borderRadius: '6px',
                  color: lane.color,
                  fontWeight: 600,
                  fontSize: '0.8rem'
                }}
              >
                <ArrowDown size={14} /> Arriving Customer Routed Here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
