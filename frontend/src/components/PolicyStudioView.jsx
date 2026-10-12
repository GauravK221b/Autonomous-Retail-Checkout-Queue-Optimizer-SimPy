import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Brain, Sliders, Zap, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function PolicyStudioView({ trainingHistory, onRetrain, isTraining }) {
  const [fixedLane2, setFixedLane2] = useState(0);
  const [policyData, setPolicyData] = useState(null);
  const [probeState, setProbeState] = useState({ q0: 1, q1: 2, q2: 0 });
  const [probeResult, setProbeResult] = useState(null);

  // Fetch policy slice when fixedLane2 changes
  useEffect(() => {
    let isMounted = true;
    api.getPolicy(fixedLane2).then((data) => {
      if (isMounted) setPolicyData(data);
    }).catch(console.error);

    return () => { isMounted = false; };
  }, [fixedLane2]);

  // Fetch probe Q-values
  useEffect(() => {
    let isMounted = true;
    api.getQValues(probeState.q0, probeState.q1, probeState.q2).then((data) => {
      if (isMounted) setProbeResult(data);
    }).catch(console.error);

    return () => { isMounted = false; };
  }, [probeState]);

  const probeChartData = probeResult ? [
    { name: 'Lane 0 (Fast)', qValue: probeResult.qValues[0], fill: '#10b981' },
    { name: 'Lane 1 (Mid)', qValue: probeResult.qValues[1], fill: '#3b82f6' },
    { name: 'Lane 2 (Slow)', qValue: probeResult.qValues[2], fill: '#f59e0b' }
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Policy Studio Header Controls */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>Reinforcement Learning Policy & Q-Function Studio</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Inspect optimal lane selection policies, value convergence, and arbitrary state transitions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span>Fixed Lane 2 Queue ($q_2$):</span>
            <select
              value={fixedLane2}
              onChange={(e) => setFixedLane2(Number(e.target.value))}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontWeight: 600
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((val) => (
                <option key={val} value={val}>q₂ = {val}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onRetrain}
            disabled={isTraining}
          >
            {isTraining ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
            {isTraining ? 'Training Agent...' : 'Retrain Agent'}
          </button>
        </div>
      </div>

      {/* Heatmap Comparison: Initial Random vs Final Q-Learning Policy */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Learned Policy Heatmap */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-title">Learned Optimal Policy [Fixed Lane 2 = {fixedLane2}]</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-success">L0: Fast</span>
              <span className="badge badge-info">L1: Mid</span>
              <span className="badge badge-warning">L2: Slow</span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Y-axis: Counter 0 Queue ($q_0 \in 0..5$) | X-axis: Counter 1 Queue ($q_1 \in 0..5$)
            </div>

            <div className="heatmap-container">
              {policyData?.learnedPolicy ? (
                policyData.learnedPolicy.map((row, q0) =>
                  row.map((action, q1) => (
                    <div
                      key={`${q0}-${q1}`}
                      className={`heatmap-cell cell-lane-${action}`}
                      title={`State: (q0=${q0}, q1=${q1}, q2=${fixedLane2}) -> Optimal Action: Lane ${action}`}
                      onClick={() => setProbeState({ q0, q1, q2: fixedLane2 })}
                    >
                      L{action}
                    </div>
                  ))
                )
              ) : (
                <div style={{ gridColumn: 'span 6', padding: '40px', textAlign: 'center' }}>Loading policy tensor...</div>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Click any cell to inspect its exact action values $Q(s, a)$.
            </div>
          </div>
        </div>

        {/* Max Q-Value Matrix */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-title">Max Q-Value Surface Slice [Fixed Lane 2 = {fixedLane2}]</span>
            </div>
            <span className="badge badge-info">$\max_a Q(s, a)$</span>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Values represent expected cumulative discounted returns from state $s$.
            </div>

            <div className="heatmap-container">
              {policyData?.maxQValues ? (
                policyData.maxQValues.map((row, q0) =>
                  row.map((val, q1) => (
                    <div
                      key={`q-${q0}-${q1}`}
                      className="heatmap-cell"
                      style={{
                        background: `rgba(16, 185, 129, ${Math.max(0.15, Math.min(0.9, (val + 10) / 15))})`,
                        color: '#ffffff',
                        fontSize: '0.72rem'
                      }}
                      title={`State: (${q0}, ${q1}, ${fixedLane2}) -> Max Q: ${val}`}
                      onClick={() => setProbeState({ q0, q1, q2: fixedLane2 })}
                    >
                      {val}
                    </div>
                  ))
                )
              ) : (
                <div style={{ gridColumn: 'span 6', padding: '40px', textAlign: 'center' }}>Loading Q surface...</div>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Higher values (darker green) indicate desirable low-congestion store states.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive State Probe & Q-Value Breakdown */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <Sliders size={18} color="#3b82f6" />
            <span className="card-title">Interactive State Probe & Action-Value Inspector</span>
          </div>
          <span className="badge badge-success">
            Inspecting State: ({probeState.q0}, {probeState.q1}, {probeState.q2})
          </span>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '14px' }}>
              Select Queue Lengths $(q_0, q_1, q_2)$:
            </div>

            {['q0', 'q1', 'q2'].map((laneKey, idx) => (
              <div key={laneKey} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Lane {idx} Active Queue:</span>
                  <span style={{ fontWeight: 700 }}>{probeState[laneKey]} Customers</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={probeState[laneKey]}
                  onChange={(e) => setProbeState({ ...probeState, [laneKey]: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#f59e0b' }}
                />
              </div>
            ))}

            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '8px', marginTop: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Policy Recommendation:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                Route arriving customer to Lane {probeResult?.bestAction ?? 0}
              </div>
            </div>
          </div>

          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Bar dataKey="qValue" name="Q(s, a)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Training Performance Convergence Curve */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <span className="card-title">Q-Learning Training Progress & Reward Convergence</span>
          </div>
          <span className="badge badge-success">250 Episodes (25 steps/ep)</span>
        </div>
        <div className="card-body" style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trainingHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
              <XAxis dataKey="episode" stroke="var(--text-muted)" fontSize={12} label={{ value: 'Episode', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="var(--text-muted)" fontSize={12} label={{ value: 'Episodic Return', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="reward" name="Raw Cumulative Return" stroke="#3b82f6" strokeWidth={1} dot={false} opacity={0.4} />
              <Line type="monotone" dataKey="movingAvg" name="10-Episode Moving Average" stroke="#10b981" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
