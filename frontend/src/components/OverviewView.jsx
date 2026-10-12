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
import { Sparkles, Info, ArrowUpRight, CheckCircle2 } from 'lucide-react';

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
  // Chart data from benchmark step details
  const timeSeriesData = benchmarkData?.stepDetails ? benchmarkData.stepDetails.slice(0, 50) : [];

  const laneBarData = [
    {
      name: 'Lane 0 (Fast)',
      current: currentQueues[0] || 0,
      capacity: maxQueueLen,
      rate: serviceRates[0] * 100
    },
    {
      name: 'Lane 1 (Mid)',
      current: currentQueues[1] || 0,
      capacity: maxQueueLen,
      rate: serviceRates[1] * 100
    },
    {
      name: 'Lane 2 (Slow)',
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
                  name="Random Baseline Queue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRandom)"
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="optTotal"
                  name="Q-Learning Optimized Queue"
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
            <span className="card-title">Autonomous Optimization Insights</span>
          </div>
          <span className="badge badge-success">Algorithm: Tabular Q-Learning (Off-Policy 1-Step TD)</span>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Asymmetric Cashier Prioritization</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                The agent prioritizes Lane 0 (Fast: μ=0.60) to maximize store customer discharge rate while dynamically diverting overflow to Lane 1 and Lane 2 only when Lane 0 queue exceeds equilibrium.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <CheckCircle2 size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Queue Variance Penalty (R_imb)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Reward function penalizes 0.5 * Var(q), actively disincentivizing cashier starvation and preventing single-line pileups that cause customer dissatisfaction.
              </div>
            </div>
          </div>


          <div style={{ display: 'flex', gap: '12px' }}>
            <CheckCircle2 size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Model-Free Learning</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                No prior knowledge of Poisson arrival distributions or exact cashier service times is required; the policy converges purely through TD error feedback.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
