import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Brain, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ConfigModal({ serviceRates, onUpdateConfig, isTraining }) {
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
    setSuccessMessage('Model successfully retrained with new hyperparameters!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={22} color="#10b981" />
          <h2 style={{ fontSize: '1.25rem' }}>Simulation Parameters & Agent Training Studio</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Configure asymmetric cashier service rates and Reinforcement Learning hyperparameters, then trigger training.
        </p>
      </div>

      {successMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981' }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Cashier Service Rates Card */}
        <div className="glass-card">
          <div className="card-header">
            <span className="card-title">Cashier Service Probabilities (μ)</span>
            <span className="badge badge-info">Departure Probability / Step</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#10b981' }}>Lane 0 (Fast Express Cashier):</span>
                <span style={{ fontWeight: 700 }}>μ₀ = {mu0}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={mu0}
                onChange={(e) => setMu0(e.target.value)}
                style={{ width: '100%', accentColor: '#10b981' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Probability that an active customer at Lane 0 finishes service in 1 timestep.
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#3b82f6' }}>Lane 1 (Mid Standard Cashier):</span>
                <span style={{ fontWeight: 700 }}>μ₁ = {mu1}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={mu1}
                onChange={(e) => setMu1(e.target.value)}
                style={{ width: '100%', accentColor: '#3b82f6' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Standard cashier checkout service speed.
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>Lane 2 (Slow Assist Cashier):</span>
                <span style={{ fontWeight: 700 }}>μ₂ = {mu2}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={mu2}
                onChange={(e) => setMu2(e.target.value)}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Assisted or bulk item cashier checkout speed.
              </div>
            </div>
          </div>
        </div>

        {/* Q-Learning Hyperparameters Card */}
        <div className="glass-card">
          <div className="card-header">
            <span className="card-title">Q-Learning Hyperparameters</span>
            <span className="badge badge-success">Bellman TD Control</span>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Learning Rate (α):</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1.0"
                value={alpha}
                onChange={(e) => setAlpha(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Discount Factor (γ):</label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="0.99"
                value={gamma}
                onChange={(e) => setGamma(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Initial Exploration (ε):</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={epsilon}
                onChange={(e) => setEpsilon(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Epsilon Decay Rate:</label>
              <input
                type="number"
                step="0.001"
                min="0.90"
                max="0.999"
                value={epsilonDecay}
                onChange={(e) => setEpsilonDecay(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Training Episodes:</label>
              <input
                type="number"
                step="25"
                min="50"
                max="1000"
                value={episodes}
                onChange={(e) => setEpisodes(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Steps per Episode:</label>
              <input
                type="number"
                step="5"
                min="10"
                max="100"
                value={stepsPerEpisode}
                onChange={(e) => setStepsPerEpisode(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', marginTop: '4px' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleResetDefaults}>
                <RotateCcw size={14} />
                Reset Defaults
              </button>

              <button type="submit" className="btn btn-primary btn-sm" disabled={isTraining} style={{ flex: 1 }}>
                {isTraining ? <RefreshCw size={14} className="animate-spin" /> : <Brain size={14} />}
                {isTraining ? 'Training Model...' : 'Retrain Q-Learning Model'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
