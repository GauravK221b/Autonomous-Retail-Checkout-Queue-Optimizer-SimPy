import React, { useState } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Zap,
  Repeat,
  CircleDot,
  TrendingUp,
  Cpu,
  Rocket,
  Shuffle,
  Scale,
  UserCheck,
  ChevronDown,
  Layers,
  GitFork,
  Target
} from 'lucide-react';

const MODEL_OPTIONS = [
  { id: 'q_learning', label: 'Q-Learning', category: 'Value-Based', tag: 'Off-Policy TD', icon: Zap, color: '#10b981' },
  { id: 'sarsa', label: 'SARSA', category: 'Value-Based', tag: 'On-Policy TD', icon: Repeat, color: '#06b6d4' },
  { id: 'bandit', label: 'Multi-Armed Bandit', category: 'Adaptive', tag: 'UCB1 Arms', icon: CircleDot, color: '#f59e0b' },
  { id: 'reinforce', label: 'REINFORCE (w/ Base)', category: 'Policy Gradient', tag: 'Monte Carlo', icon: TrendingUp, color: '#ec4899' },
  { id: 'a2c', label: 'A2C Actor-Critic', category: 'Actor-Critic', tag: 'Advantage TD', icon: Cpu, color: '#8b5cf6' },
  { id: 'ppo', label: 'PPO Policy Opt', category: 'Actor-Critic', tag: 'Clipped Surrogate', icon: Rocket, color: '#6366f1' },
  { id: 'dqn', label: 'DQN (Deep Q-Net)', category: 'Deep RL', tag: 'Experience Replay', icon: Layers, color: '#14b8a6' },
  { id: 'double_dqn', label: 'Double DQN', category: 'Deep RL', tag: 'Decoupled Target', icon: GitFork, color: '#0ea5e9' },
  { id: 'ddpg', label: 'DDPG Actor-Critic', category: 'Deep RL', tag: 'Deterministic PG', icon: Target, color: '#a855f7' },
  { id: 'shortest_queue', label: 'Shortest Queue', category: 'Heuristic', tag: 'Greedy', icon: Scale, color: '#3b82f6' },
  { id: 'random', label: 'Random Baseline', category: 'Baseline', tag: 'Uniform', icon: Shuffle, color: '#94a3b8' },
  { id: 'manual', label: 'Manual Dispatch', category: 'User', tag: 'Click Lane', icon: UserCheck, color: '#f97316' }
];

export default function SimulationControls({
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  mode,
  setMode,
  speed,
  setSpeed,
  stepCount,
  totalReward
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeOpt = MODEL_OPTIONS.find((m) => m.id === mode) || MODEL_OPTIONS[0];
  const ActiveIcon = activeOpt.icon;

  return (
    <div className="glass-card controls-deck">
      {/* Play / Step / Reset Actions */}
      <div className="control-group">
        <button
          className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause Auto-dispatch' : 'Start Auto-dispatch'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause Sim' : 'Auto Play'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onStep}
          disabled={isPlaying}
          title="Dispatch 1 customer arrival"
        >
          <StepForward size={18} />
          Step (+1 Cust)
        </button>

        <button
          className="btn btn-outline"
          onClick={onReset}
          title="Reset Queues to random state"
        >
          <RotateCcw size={18} />
          Reset State
        </button>
      </div>

      {/* Model & Policy Selector */}
      <div className="control-group" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Active Agent:</span>
          
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderColor: activeOpt.color,
                background: 'var(--bg-tertiary)',
                fontWeight: 600
              }}
              title="Select Reinforcement Learning Model"
            >
              <ActiveIcon size={16} color={activeOpt.color} />
              <span>{activeOpt.label}</span>
              <span style={{
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '4px',
                background: `${activeOpt.color}25`,
                color: activeOpt.color
              }}>
                {activeOpt.tag}
              </span>
              <ChevronDown size={14} style={{ opacity: 0.6 }} />
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                  zIndex: 100,
                  minWidth: '280px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 8px', fontWeight: 700 }}>
                  Select Routing Optimizer
                </div>
                {MODEL_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = opt.id === mode;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setMode(opt.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: isSelected ? `1px solid ${opt.color}` : '1px solid transparent',
                        background: isSelected ? `${opt.color}15` : 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={16} color={opt.color} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{opt.label}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{opt.category}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${opt.color}20`,
                        color: opt.color,
                        fontWeight: 600
                      }}>
                        {opt.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speed Slider & Telemetry */}
      <div className="control-group">
        <div className="speed-slider-group">
          <span>Speed:</span>
          <input
            type="range"
            min="300"
            max="2500"
            step="100"
            value={2800 - speed}
            onChange={(e) => setSpeed(2800 - Number(e.target.value))}
            title="Adjust simulation delay per step"
          />
          <span style={{ minWidth: '40px', fontWeight: 600 }}>
            {speed <= 600 ? 'Fast' : speed <= 1200 ? 'Normal' : 'Slow'}
          </span>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px', display: 'flex', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Step</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stepCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reward</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: totalReward < 0 ? '#ef4444' : '#10b981' }}>
              {totalReward.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
