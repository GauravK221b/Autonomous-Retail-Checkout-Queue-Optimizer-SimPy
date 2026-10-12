import React from 'react';
import { User, CheckCircle2, AlertCircle, Zap, ArrowDown, UserPlus } from 'lucide-react';

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
            className={`glass-card lane-card ${isTarget ? 'is-target' : ''}`}
            style={{
              '--lane-color': lane.color,
              '--lane-color-bg': lane.colorBg,
              '--lane-glow': lane.glow
            }}
          >
            <div className="lane-header">
              <div className="lane-name-group">
                <span className="lane-badge">LANE {lane.id}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{lane.name}</div>
                  <div className="lane-rate-tag">{lane.description}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                  μ = {lane.rate} prob
                </span>
              </div>
            </div>

            {/* Cashier Station Counter */}
            <div className="cashier-station">
              <div className="cashier-info">
                <div className="cashier-avatar">
                  <User size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cashier #{lane.id + 1}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Speed: {lane.speedLabel}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                {count > 0 ? (
                  <span className="cashier-status-pill status-serving">
                    ● Serving
                  </span>
                ) : (
                  <span className="cashier-status-pill status-idle">
                    ○ Idle
                  </span>
                )}
                {isServed && (
                  <span className="badge badge-success" style={{ animation: 'bounce 0.5s' }}>
                    <CheckCircle2 size={12} /> Served!
                  </span>
                )}
              </div>
            </div>

            {/* Active Queue Length Visualization */}
            <div className="queue-area">
              <div className="queue-label-bar">
                <span>Active Queue Load:</span>
                <span style={{ fontWeight: 700, color: isFull ? '#ef4444' : 'var(--text-primary)' }}>
                  {count} / {maxQueueLen} {isFull ? '(FULL)' : 'Customers'}
                </span>
              </div>

              <div className="queue-slots-container">
                {Array.from({ length: maxQueueLen }).map((_, slotIdx) => {
                  const isOccupied = slotIdx < count;
                  return (
                    <div
                      key={slotIdx}
                      className={`queue-slot ${isOccupied ? 'occupied' : 'empty'}`}
                      title={isOccupied ? `Customer #${slotIdx + 1} waiting` : 'Empty queue slot'}
                    >
                      {isOccupied ? <User size={18} /> : (slotIdx + 1)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Q-Value Telemetry for this lane */}
            <div className="q-value-display">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color={lane.color} />
                <span>Q(s, a={lane.id}):</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {qVal.toFixed(3)}
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
