import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Download, Search, FileSpreadsheet, ArrowDownRight, TrendingDown } from 'lucide-react';

export default function BenchmarkLogsView({ benchmarkData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  const steps = benchmarkData?.stepDetails || [];
  const randTotalWait = benchmarkData?.randomTotalWait ?? 381;
  const optTotalWait = benchmarkData?.optimizedTotalWait ?? 268;
  const reductionPct = benchmarkData?.congestionReductionPct ?? 29.66;
  const waitDiff = randTotalWait - optTotalWait;

  // Filter logs
  const filteredSteps = steps.filter((s) => {
    const matchesSearch = s.step.toString().includes(searchTerm);
    const matchesAction = selectedActionFilter === 'all' || s.optAction.toString() === selectedActionFilter;
    return matchesSearch && matchesAction;
  });

  // Export CSV
  const exportCSV = () => {
    if (!steps.length) return;
    const headers = 'Step,Random_L0,Random_L1,Random_L2,Random_Total,Random_Action,Opt_L0,Opt_L1,Opt_L2,Opt_Total,Opt_Action,Savings\n';
    const rows = steps.map((s) =>
      `${s.step},${s.randomLanes[0]},${s.randomLanes[1]},${s.randomLanes[2]},${s.randomTotal},Lane ${s.randomAction},${s.optLanes[0]},${s.optLanes[1]},${s.optLanes[2]},${s.optTotal},Lane ${s.optAction},${s.waitDifference}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optiqueue_benchmark_100steps.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Benchmark Summary Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={22} color="#10b981" />
              <h2 style={{ fontSize: '1.25rem' }}>100-Timestep Simulation Benchmark Evaluation</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Evaluating trained Tabular Q-Learning policy directly against Random routing under identical seeds.
            </p>
          </div>

          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download size={16} />
            Export Benchmark CSV
          </button>
        </div>

        {/* 4 Summary Stat Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Random Baseline Wait</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{randTotalWait}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total customer wait-units</div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Q-Learning Wait</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{optTotalWait}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total customer wait-units</div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Congestion Reduction</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{reductionPct}%</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total backlog reduction</div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Savings</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6' }}>-{waitDiff}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Wait-units eliminated</div>
          </div>
        </div>
      </div>

      {/* Store Load Over Time (Plot 5 replica) */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <span className="card-title">Total Customers in Store Over Time (100 Steps)</span>
          </div>
          <span className="badge badge-success">Cumulative Store Load Profile</span>
        </div>
        <div className="card-body" style={{ height: '340px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={steps} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
              <XAxis dataKey="step" stroke="var(--text-muted)" fontSize={12} label={{ value: 'Simulation Steps', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="var(--text-muted)" fontSize={12} label={{ value: 'Total Queue Length', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="randomTotal"
                name="Random Baseline Queue Load"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="optTotal"
                name="Q-Learning Optimized Queue Load"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Step Transition Logs Table */}
      <div className="glass-card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div className="card-title-group">
            <span className="card-title">Step-by-Step Transition & Allocation Logs</span>
            <span className="badge badge-info">{filteredSteps.length} of {steps.length} Steps</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search step #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '7px 12px 7px 32px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '7px 10px',
                fontSize: '0.85rem'
              }}
            >
              <option value="all">All Routed Lanes</option>
              <option value="0">Routed Lane 0</option>
              <option value="1">Routed Lane 1</option>
              <option value="2">Routed Lane 2</option>
            </select>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th>Step</th>
                  <th>Random Queues (q₀, q₁, q₂)</th>
                  <th>Random Routed</th>
                  <th>Random Total</th>
                  <th>Opt Queues (q₀, q₁, q₂)</th>
                  <th>Opt Routed</th>
                  <th>Opt Total</th>
                  <th>Wait Delta</th>
                </tr>
              </thead>
              <tbody>
                {filteredSteps.map((s) => (
                  <tr key={s.step}>
                    <td style={{ fontWeight: 700 }}>#{s.step}</td>
                    <td>({s.randomLanes.join(', ')})</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                        Lane {s.randomAction}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.randomTotal}</td>
                    <td>({s.optLanes.join(', ')})</td>
                    <td>
                      <span className={`badge cell-lane-${s.optAction}`} style={{ padding: '3px 8px' }}>
                        Lane {s.optAction}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{s.optTotal}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: s.waitDifference > 0 ? '#10b981' : (s.waitDifference < 0 ? '#ef4444' : 'var(--text-muted)') }}>
                        {s.waitDifference > 0 ? `-${s.waitDifference} saved` : (s.waitDifference < 0 ? `+${Math.abs(s.waitDifference)}` : '0')}
                      </span>
                    </td>
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
