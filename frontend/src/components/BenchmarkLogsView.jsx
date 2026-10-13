import React, { useState } from 'react';
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
import { Download, Search, FileSpreadsheet, Trophy, ArrowDownRight, TrendingDown } from 'lucide-react';

export default function BenchmarkLogsView({ benchmarkData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  const steps = benchmarkData?.stepDetails || [];
  const randTotalWait = benchmarkData?.randomTotalWait ?? 381;
  const optTotalWait = benchmarkData?.optimizedTotalWait ?? 268;
  const reductionPct = benchmarkData?.congestionReductionPct ?? 29.66;
  const leaderboard = benchmarkData?.leaderboard || [];

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
    a.download = `optiqueue_multi_model_benchmark_100steps.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = leaderboard.map((m) => ({
    name: m.name,
    totalWait: m.totalWait,
    improvement: m.improvement
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Benchmark Summary Card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={22} color="#10b981" />
              <h2 style={{ fontSize: '1.25rem' }}>100-Timestep Multi-Model Benchmark Arena</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Side-by-side evaluation across all 6 Reinforcement Learning algorithms and heuristic baselines under identical seeds.
            </p>
          </div>

          <button className="btn btn-secondary" onClick={exportCSV} disabled={!steps.length}>
            <Download size={16} />
            Export Benchmark CSV
          </button>
        </div>

        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Random Baseline Wait</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
              {randTotalWait} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>units</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Avg {benchmarkData?.randomAvgWaitPerStep ?? 3.81} / step
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Top RL Optimizer Wait</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {leaderboard[0]?.totalWait ?? optTotalWait} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>units</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Leader: {leaderboard[0]?.name ?? 'Q-Learning'}
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Max Congestion Reduction</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {leaderboard[0]?.improvement ? `+${leaderboard[0].improvement}%` : `+${reductionPct}%`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              vs Baseline Random Dispatch
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Models Evaluated</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-color)', marginTop: '4px' }}>
              {leaderboard.length || 8} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>policies</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              6 RL + 2 Baselines
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table & Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        {/* Leaderboard Table */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <Trophy size={18} color="#f59e0b" />
              <span className="card-title">Multi-Model Performance Ranking</span>
            </div>
            <span className="badge badge-success">Ranked by Total Wait</span>
          </div>

          <div className="card-body" style={{ padding: '0' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px' }}>Rank</th>
                    <th style={{ padding: '10px 14px' }}>Algorithm</th>
                    <th style={{ padding: '10px 14px' }}>Type</th>
                    <th style={{ padding: '10px 14px' }}>Total Wait</th>
                    <th style={{ padding: '10px 14px' }}>Avg / Step</th>
                    <th style={{ padding: '10px 14px' }}>Reduction</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((m, idx) => {
                    const isWinner = idx === 0;
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 800 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: isWinner ? '#f59e0b' : 'var(--bg-tertiary)',
                            color: isWinner ? '#000' : 'var(--text-primary)',
                            fontSize: '0.72rem'
                          }}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{m.name}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{m.tag}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, fontFamily: 'monospace' }}>{m.totalWait}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{m.avgWait}</td>
                        <td style={{
                          padding: '10px 14px',
                          fontWeight: 700,
                          color: m.improvement > 0 ? '#10b981' : m.improvement < 0 ? '#ef4444' : 'var(--text-muted)'
                        }}>
                          {m.improvement > 0 ? `+${m.improvement}%` : `${m.improvement}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Total Wait Comparison Bar Chart */}
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-title">Total Wait-Units by Algorithm</span>
            </div>
            <span className="badge badge-info">Lower is Better</span>
          </div>

          <div className="card-body" style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Bar dataKey="totalWait" name="Total Customer Wait" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Step-by-Step Transition Log Table */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-title-group">
            <span className="card-title">Detailed Step-by-Step Transition Logs ({filteredSteps.length} Steps)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search step #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px 6px 32px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Step</th>
                  <th style={{ padding: '10px 14px' }}>Random Queue [0, 1, 2]</th>
                  <th style={{ padding: '10px 14px' }}>Random Action</th>
                  <th style={{ padding: '10px 14px' }}>RL Queue [0, 1, 2]</th>
                  <th style={{ padding: '10px 14px' }}>RL Action</th>
                  <th style={{ padding: '10px 14px' }}>Wait Difference</th>
                </tr>
              </thead>
              <tbody>
                {filteredSteps.slice(0, 100).map((s) => (
                  <tr key={s.step} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>#{s.step}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>
                      [{s.randomLanes.join(', ')}] = {s.randomTotal}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#ef4444', fontWeight: 600 }}>
                      Lane {s.randomAction}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>
                      [{s.optLanes.join(', ')}] = {s.optTotal}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 600 }}>
                      Lane {s.optAction}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: s.waitDifference >= 0 ? '#10b981' : '#ef4444' }}>
                      {s.waitDifference >= 0 ? `+${s.waitDifference}` : s.waitDifference}
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
