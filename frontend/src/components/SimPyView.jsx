import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Clock, Play, CheckCircle2, TrendingDown, Users, Percent, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function SimPyView({ initialData }) {
  const [simpyResults, setSimpyResults] = useState(initialData);
  const [arrivalRate, setArrivalRate] = useState(1.0);
  const [simTime, setSimTime] = useState(120);
  const [isRunning, setIsRunning] = useState(false);

  const runSimPySimulation = async () => {
    setIsRunning(true);
    try {
      const data = await api.runSimPy({
        arrivalRate: Number(arrivalRate),
        simulationTime: Number(simTime)
      });
      setSimpyResults(data);
    } catch (err) {
      console.error('Failed to run SimPy simulation:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const summary = simpyResults?.summary || [];
  const waitReductionPct = simpyResults?.waitReductionPct ?? 32.5;

  // Chart data for wait times
  const waitTimeChartData = summary.map((s) => ({
    policy: s.label,
    avgWaitTime: s.avgWaitTime,
    maxWaitTime: s.maxWaitTime,
    served: s.customersServed
  }));

  // Chart data for utilization
  const utilizationChartData = summary.map((s) => ({
    policy: s.label,
    'Lane 0 (Fast: μ=0.6)': s.utilization[0] || 0,
    'Lane 1 (Mid: μ=0.4)': s.utilization[1] || 0,
    'Lane 2 (Slow: μ=0.3)': s.utilization[2] || 0
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SimPy Header & Controls */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={22} color="#10b981" />
            <h2 style={{ fontSize: '1.25rem' }}>SimPy Discrete-Event Queue Simulation Engine</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Simulates continuous stochastic customer arrival processes (`simpy.Environment`) and cashier server resources.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span>Arrival Rate (λ):</span>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="2.5"
              value={arrivalRate}
              onChange={(e) => setArrivalRate(e.target.value)}
              style={{
                width: '70px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontWeight: 600
              }}
            />
            <span style={{ color: 'var(--text-muted)' }}>cust/sec</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span>Duration:</span>
            <select
              value={simTime}
              onChange={(e) => setSimTime(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontWeight: 600
              }}
            >
              <option value="60">60 Seconds</option>
              <option value="120">120 Seconds</option>
              <option value="300">300 Seconds</option>
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={runSimPySimulation}
            disabled={isRunning}
          >
            {isRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            {isRunning ? 'Running SimPy...' : 'Execute SimPy Run'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for SimPy */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card" style={{ '--card-accent': '#10b981' }}>
          <div className="kpi-top">
            <span className="kpi-label">Average Wait Reduction</span>
            <div className="kpi-icon-box">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{waitReductionPct}%</span>
            <span className="kpi-unit">Faster</span>
          </div>
          <div className="kpi-subtext">
            <span className="badge badge-success">SimPy Event Metrics</span>
            <span>Q-Learning vs Random Baseline</span>
          </div>
        </div>

        {summary.map((pol, idx) => (
          <div
            key={pol.policy}
            className="glass-card kpi-card"
            style={{ '--card-accent': idx === 0 ? '#ef4444' : idx === 1 ? '#3b82f6' : '#10b981' }}
          >
            <div className="kpi-top">
              <span className="kpi-label">{pol.label}</span>
              <div className="kpi-icon-box">
                <Users size={20} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{pol.avgWaitTime}</span>
              <span className="kpi-unit">sec wait</span>
            </div>
            <div className="kpi-subtext">
              <span>Served: {pol.customersServed} | Max Wait: {pol.maxWaitTime}s</span>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Charts: Average Wait Times & Server Utilization */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        {/* Wait Time Bar Chart */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-title">Average & Max Customer Wait Time</span>
            </div>
            <span className="badge badge-success">Seconds</span>
          </div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitTimeChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis dataKey="policy" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="avgWaitTime" name="Average Wait Time (s)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="maxWaitTime" name="Maximum Peak Wait (s)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cashier Utilization Bar Chart */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-title">Cashier Server Utilization (%)</span>
            </div>
            <span className="badge badge-info">Busy Time / Total Time</span>
          </div>
          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis dataKey="policy" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} label={{ value: '% Utilization', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Lane 0 (Fast: μ=0.6)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lane 1 (Mid: μ=0.4)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lane 2 (Slow: μ=0.3)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SimPy Comparison Table */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <span className="card-title">SimPy Discrete-Event Simulation Policy Matrix</span>
          </div>
          <span className="badge badge-success">Duration: {simTime}s | Arrival Rate λ: {arrivalRate}</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Dispatch Strategy</th>
                  <th>Customers Served</th>
                  <th>Average Wait Time</th>
                  <th>Maximum Peak Wait</th>
                  <th>Avg Total Store Queue</th>
                  <th>Lane 0 Utilization</th>
                  <th>Lane 1 Utilization</th>
                  <th>Lane 2 Utilization</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.policy}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    <td>{row.customersServed} customers</td>
                    <td style={{ fontWeight: 700, color: row.policy === 'q_learning' ? '#10b981' : 'inherit' }}>
                      {row.avgWaitTime}s
                    </td>
                    <td>{row.maxWaitTime}s</td>
                    <td>{row.avgTotalQueue}</td>
                    <td>{row.utilization[0]}%</td>
                    <td>{row.utilization[1]}%</td>
                    <td>{row.utilization[2]}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
