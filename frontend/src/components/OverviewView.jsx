import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import KPICards from './KPICards';
import CheckoutLanesView from './CheckoutLanesView';
import SimulationControls from './SimulationControls';
import { Sparkles, Trophy, Cpu, Zap, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function OverviewView({
  benchmarkData,
  currentQueues,
  serviceRates,
  maxQueueLen,
  lastAction,
  lastServed,
  qValues,
  recommendedAction,
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  mode,
  setMode,
  speed,
  setSpeed,
  stepCount,
  totalReward,
  onManualDispatch
}) {
  const timeSeriesData = benchmarkData?.stepDetails ? benchmarkData.stepDetails.slice(0, 50) : [];
  const leaderboard = benchmarkData?.leaderboard || [];

  const laneBarData = [
    {
      name: 'Lane 0 (Fast: μ=0.6)',
      current: currentQueues[0] || 0,
      capacity: maxQueueLen,
      rate: serviceRates[0] * 100
    },
    {
      name: 'Lane 1 (Mid: μ=0.4)',
      current: currentQueues[1] || 0,
      capacity: maxQueueLen,
      rate: serviceRates[1] * 100
    },
    {
      name: 'Lane 2 (Slow: μ=0.3)',
      current: currentQueues[2] || 0,
      capacity: maxQueueLen,
      rate: serviceRates[2] * 100
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Cards Deck */}
      <KPICards
        benchmarkData={benchmarkData}
        currentQueues={currentQueues}
        serviceRates={serviceRates}
      />

      {/* Simulation Controls Toolbar */}
      <SimulationControls
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onStep={onStep}
        onReset={onReset}
        mode={mode}
        setMode={setMode}
        speed={speed}
        setSpeed={setSpeed}
        stepCount={stepCount}
        totalReward={totalReward}
      />

      {/* Visual Animated Checkout Counters */}
      <CheckoutLanesView
        queues={currentQueues}
        maxQueueLen={maxQueueLen}
        serviceRates={serviceRates}
        lastAction={lastAction}
        lastServed={lastServed}
        qValues={qValues}
        recommendedAction={recommendedAction}
        mode={mode}
        onManualDispatch={onManualDispatch}
      />

      {/* Multi-Model Benchmark Leaderboard Banner */}
      {leaderboard.length > 0 && (
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={20} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                RL Model Arena Leaderboard (100 Steps)
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Ranked by Lowest Customer Wait Units
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            {leaderboard.map((m, idx) => {
              const isSelected = m.id === mode;
              const isWinner = idx === 0;
              return (
                <div
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #10b981' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  title="Click to activate this model in simulation"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isWinner ? '#f59e0b' : 'var(--bg-secondary)',
                        color: isWinner ? '#000' : 'var(--text-primary)'
                      }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.name}</span>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: '0.65rem', background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        Active
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Wait</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{m.totalWait} units</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reduction</div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: m.improvement > 0 ? '#10b981' : m.improvement < 0 ? '#ef4444' : 'var(--text-muted)'
                      }}>
                        {m.improvement > 0 ? `+${m.improvement}%` : `${m.improvement}%`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recharts Data Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        {/* Real-time Queue Load Over Time Chart */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-title">Store Queue Load Over Time</span>
            </div>
            <span className="badge badge-success">Benchmark (First 50 Steps)</span>
          </div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRandom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis dataKey="step" stroke="var(--text-muted)" fontSize={12} label={{ value: 'Simulation Step', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="var(--text-muted)" fontSize={12} label={{ value: 'Total Queue', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  type="monotone"
                  dataKey="randomTotal"
                  name="Random Baseline"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRandom)"
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="optTotal"
                  name="Active RL Agent"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOpt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Lane Occupancy Bar Chart */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-title">Live Lane Queue Occupancy</span>
            </div>
            <span className="badge badge-info">Capacity vs Active Load</span>
          </div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={laneBarData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={[0, maxQueueLen]} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="current" name="Active Customers Waiting" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacity" name="Maximum Lane Capacity (5)" fill="#374151" opacity={0.3} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Intelligence Card */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <Sparkles size={18} color="#10b981" />
            <span className="card-title">Reinforcement Learning Architecture Spectrum</span>
          </div>
          <span className="badge badge-success">6 Algorithms Implemented & Active</span>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Value-Based: Q-Learning vs SARSA</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Q-Learning learns optimal off-policy values while SARSA accounts for exploration, learning safer routing policies near queue thresholds.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <CheckCircle2 size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Multi-Armed Bandit (UCB1)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Adaptive arm selection baseline utilizing Upper Confidence Bounds for immediate queue reward balancing without discount factor.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <CheckCircle2 size={20} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Policy Gradients: REINFORCE, A2C, PPO</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                From episodic Monte Carlo with baseline (REINFORCE) to TD Actor-Critic (A2C) and clipped surrogate objectives (PPO) for high stability.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
