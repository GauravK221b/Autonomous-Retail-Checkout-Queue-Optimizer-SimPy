import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Brain, CheckCircle2, RefreshCw, Zap } from 'lucide-react';

export default function ConfigModal({ serviceRates, onUpdateConfig, isTraining }) {
  const [modelType, setModelType] = useState('all');
  const [mu0, setMu0] = useState(serviceRates[0] ?? 0.6);
  const [mu1, setMu1] = useState(serviceRates[1] ?? 0.4);
  const [mu2, setMu2] = useState(serviceRates[2] ?? 0.3);

  const [alpha, setAlpha] = useState(0.1);
  const [gamma, setGamma] = useState(0.95);
  const [epsilon, setEpsilon] = useState(0.4);
  const [epsilonDecay, setEpsilonDecay] = useState(0.995);
  const [minEpsilon, setMinEpsilon] = useState(0.05);
  const [episodes, setEpisodes] = useState(250);
  const [stepsPerEpisode, setStepsPerEpisode] = useState(25);

  const [successMessage, setSuccessMessage] = useState('');

  const handleResetDefaults = () => {
    setModelType('all');
    setMu0(0.6);
    setMu1(0.4);
    setMu2(0.3);
    setAlpha(0.1);
    setGamma(0.95);
    setEpsilon(0.4);
    setEpsilonDecay(0.995);
    setMinEpsilon(0.05);
    setEpisodes(250);
    setStepsPerEpisode(25);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    const config = {
      modelType: modelType === 'all' ? null : modelType,
      serviceRates: [Number(mu0), Number(mu1), Number(mu2)],
      alpha: Number(alpha),
      gamma: Number(gamma),
      epsilon: Number(epsilon),
      epsilonDecay: Number(epsilonDecay),
      minEpsilon: Number(minEpsilon),
      episodes: Number(episodes),
      stepsPerEpisode: Number(stepsPerEpisode)
    };
    await onUpdateConfig(config);
    setSuccessMessage('Model(s) successfully retrained with updated hyperparameters!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={22} color="#10b981" />
          <h2 style={{ fontSize: '1.25rem' }}>Multi-Model Hyperparameters & Training Studio</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Configure asymmetric cashier departure rates and tune hyperparameters across Q-Learning, SARSA, Bandits, REINFORCE, A2C, and PPO.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Model Target Selection Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Brain size={18} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Training Target Model</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { id: 'all', label: 'All Models in Arena', desc: 'Trains all 9 RL models' },
              { id: 'q_learning', label: 'Q-Learning', desc: 'Off-policy 1-step TD' },
              { id: 'sarsa', label: 'SARSA', desc: 'On-policy safe TD' },
              { id: 'bandit', label: 'Multi-Armed Bandit', desc: 'Contextual UCB1 arms' },
              { id: 'reinforce', label: 'REINFORCE', desc: 'Monte Carlo policy gradient' },
              { id: 'a2c', label: 'A2C Actor-Critic', desc: 'Advantage TD actor-critic' },
              { id: 'ppo', label: 'PPO', desc: 'Clipped surrogate objective' },
              { id: 'dqn', label: 'DQN', desc: 'Experience replay + target net' },
              { id: 'double_dqn', label: 'Double DQN', desc: 'Decoupled greedy Q-eval' },
              { id: 'ddpg', label: 'DDPG', desc: 'Deterministic policy gradient' }
            ].map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: modelType === opt.id ? '2px solid #10b981' : '1px solid var(--border-color)',
                  background: modelType === opt.id ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="modelTarget"
                  value={opt.id}
                  checked={modelType === opt.id}
                  onChange={(e) => setModelType(e.target.value)}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Cashier Service Rates Configuration */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Zap size={18} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Checkout Lane Service Rates (μ)</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Lane 0 Service Rate (μ₀ - Fast Express):
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={mu0}
                onChange={(e) => setMu0(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default: 0.60 (60% service completion per step)</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Lane 1 Service Rate (μ₁ - Standard Mid):
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={mu1}
                onChange={(e) => setMu1(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default: 0.40 (40% service completion per step)</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Lane 2 Service Rate (μ₂ - Slow Assist):
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={mu2}
                onChange={(e) => setMu2(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Default: 0.30 (30% service completion per step)</span>
            </div>
          </div>
        </div>

        {/* RL Training Hyperparameters */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Brain size={18} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Algorithm Hyperparameters</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Learning Rate (α):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1.0"
                value={alpha}
                onChange={(e) => setAlpha(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Step size (Default: 0.10)</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Discount Factor (γ):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="0.99"
                value={gamma}
                onChange={(e) => setGamma(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Future horizon weight (Default: 0.95)</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Initial Exploration (ε):
              </label>
              <input
                type="number"
                step="0.05"
                min="0.0"
                max="1.0"
                value={epsilon}
                onChange={(e) => setEpsilon(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Initial epsilon-greedy probability</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Training Episodes:
              </label>
              <input
                type="number"
                step="50"
                min="50"
                max="1000"
                value={episodes}
                onChange={(e) => setEpisodes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total training iterations (Default: 250)</span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="btn btn-outline" onClick={handleResetDefaults} disabled={isTraining}>
            <RotateCcw size={16} />
            Reset Defaults
          </button>
          <button type="submit" className="btn btn-primary" disabled={isTraining}>
            {isTraining ? <RefreshCw size={16} className="spin-icon" /> : <Save size={16} />}
            {isTraining ? 'Training in Progress...' : 'Apply & Retrain Agent'}
          </button>
        </div>
      </form>
    </div>
  );
}
