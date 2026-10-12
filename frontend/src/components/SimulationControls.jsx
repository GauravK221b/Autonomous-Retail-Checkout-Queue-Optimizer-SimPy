import React from 'react';
import { Play, Pause, StepForward, RotateCcw, Sliders, Zap, Shuffle, UserCheck } from 'lucide-react';

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
  return (
    <div className="glass-card controls-deck">
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

      <div className="control-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Policy Mode:</span>
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '3px' }}>
            <button
              className={`btn btn-sm ${mode === 'q_learning' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none' }}
              onClick={() => setMode('q_learning')}
            >
              <Zap size={14} />
              Q-Learning Agent
            </button>
            <button
              className={`btn btn-sm ${mode === 'random' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none' }}
              onClick={() => setMode('random')}
            >
              <Shuffle size={14} />
              Random Baseline
            </button>
            <button
              className={`btn btn-sm ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none' }}
              onClick={() => setMode('manual')}
            >
              <UserCheck size={14} />
              Manual Dispatch
            </button>
          </div>
        </div>
      </div>

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
