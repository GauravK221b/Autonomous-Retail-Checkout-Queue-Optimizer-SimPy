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
import { Clock, Play, CheckCircle2, TrendingDown, Users, Percent, RefreshCw, Trophy } from 'lucide-react';
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
  const bestPolicy = simpyResults?.bestPolicy || (summary[0]?.label ?? 'Q-Learning');

  // Chart data for wait times
  const waitTimeChartData = summary.map((s) => ({
    policy: s.label.replace(' (Off-Policy TD)', '').replace(' (On-Policy TD)', '').replace(' (w/ Baseline)', ''),
    avgWaitTime: s.avgWaitTime,
    maxWaitTime: s.maxWaitTime,
    served: s.customersServed
  }));

  // Chart data for utilization
  const utilizationChartData = summary.map((s) => ({
    policy: s.label.replace(' (Off-Policy TD)', '').replace(' (On-Policy TD)', '').replace(' (w/ Baseline)', ''),
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
            <h2 style={{ fontSize: '1.25rem' }}>SimPy Multi-Policy Discrete-Event Simulation Arena</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Simulates continuous stochastic customer arrivals (`simpy.Environment`) and cashier server resources across all 6 RL algorithms.
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
            {isRunning ? <RefreshCw size={16} className="spin-icon" /> : <Play size={16} />}
            {isRunning ? 'Running SimPy...' : 'Execute Arena Run'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for SimPy */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card" style={{ '--card-accent': '#10b981' }}>
          <div className="kpi-top">
            <span className="kpi-label">Top Performing Strategy</span>
            <div className="kpi-icon-box">
              <Trophy size={20} color="#f59e0b" />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ fontSize: '1.25rem' }}>{bestPolicy}</span>
          </div>
          <div className="kpi-subtext">
            <span className="badge badge-success">Discrete-Event Winner</span>
            <span>Lowest Average Wait Time</span>
          </div>
        </div>

        {summary.slice(0, 3).map((pol, idx) => (
          <div
            key={pol.policy}
            className="glass-card kpi-card"
            style={{ '--card-accent': pol.color || '#3b82f6' }}
          >
            <div className="kpi-top">
              <span className="kpi-label">#{idx + 1}: {pol.label}</span>
              <div className="kpi-icon-box">
                <Users size={20} color={pol.color} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{pol.avgWaitTime}</span>
              <span className="kpi-unit">sec wait</span>
            </div>
            <div className="kpi-subtext">
              <span>Served: {pol.customersServed} | Max: {pol.maxWaitTime}s</span>
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
              <span className="card-title">Average & Max Customer Wait Time by Model</span>
            </div>
            <span className="badge badge-success">Seconds</span>
          </div>
          <div className="card-body" style={{ height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitTimeChartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis dataKey="policy" stroke="var(--text-muted)" fontSize={11} interval={0} angle={-15} textAnchor="end" />
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
              <span className="card-title">Cashier Server Utilization (%) Across Policies</span>
            </div>
            <span className="badge badge-info">Busy Time / Total Time</span>
          </div>
          <div className="card-body" style={{ height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationChartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis dataKey="policy" stroke="var(--text-muted)" fontSize={11} interval={0} angle={-15} textAnchor="end" />
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
            <span className="card-title">SimPy Discrete-Event Simulation Arena Matrix</span>
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
                  <th>Lane 0 (μ=0.6)</th>
                  <th>Lane 1 (μ=0.4)</th>
                  <th>Lane 2 (μ=0.3)</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.policy}>
                    <td style={{ fontWeight: 700, color: row.color || 'inherit' }}>{row.label}</td>
                    <td>{row.customersServed} customers</td>
                    <td style={{ fontWeight: 700, color: row.avgWaitTime < 2.5 ? '#10b981' : row.avgWaitTime > 4.0 ? '#ef4444' : 'inherit' }}>
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
