# 🛒 OptiQueue AI — Autonomous Retail Checkout Queue Optimizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![SimPy](https://img.shields.io/badge/SimPy-Discrete--Event-brightgreen.svg)](https://simpy.readthedocs.io/)

> **OptiQueue AI** is an end-to-end autonomous retail checkout queue optimization framework combining **9 Reinforcement Learning (RL) architectures**, **SimPy Discrete-Event Simulation**, and a **modern React analytics dashboard** with real-time checkout lane animations, policy surface visualizers, and comparative benchmark leaderboards.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [RL Architecture Spectrum](#-rl-architecture-spectrum)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Benchmark Results](#-benchmark-results)
- [License](#-license)

---

## 🎯 Overview

Retail checkout counters face volatile customer arrival rates and heterogeneous cashier throughputs ($\mu_0 > \mu_1 > \mu_2$). Traditional heuristics such as **Random Allocation** or naive **Shortest Queue First** frequently cause cashier idle time or bottleneck fast servers.

**OptiQueue AI** treats queue dispatching as a Markov Decision Process (MDP) over the continuous- or discrete-state queue vector $(q_0, q_1, q_2)$, learning dynamic routing policies that balance:
- Minimizing customer wait times across all counters
- Maximizing high-speed cashier utilization
- Preventing queue overflow and mitigating variance

---

## 🧠 RL Architecture Spectrum

The system incorporates **9 reinforcement learning paradigms** implementing value-based, policy gradient, actor-critic, and deep neural approaches:

| # | Algorithm | Category | Mathematical Core / Objective |
|---|---|---|---|
| 1 | **Tabular Q-Learning** | Value-based (Off-policy) | $Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma \max_{a'} Q(s', a') - Q(s, a)]$ |
| 2 | **SARSA** | Value-based (On-policy) | $Q(s, a) \leftarrow Q(s, a) + \alpha [r + \gamma Q(s', a') - Q(s, a)]$ |
| 3 | **Contextual UCB1 Bandit** | Exploration-Exploitation | $a = \arg\max_a \left[\hat{\mu}_a + c \sqrt{\frac{\ln N}{N_a}}\right]$ |
| 4 | **REINFORCE (with Baseline)** | Monte Carlo Policy Gradient | $\nabla_\theta J(\theta) = \mathbb{E} \left[ \sum_{t} \nabla_\theta \ln \pi_\theta(a_t \mid s_t) (G_t - V_\phi(s_t)) \right]$ |
| 5 | **A2C (Advantage Actor-Critic)** | Synchronous Actor-Critic | $\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$, updates policy and baseline simultaneously |
| 6 | **PPO (Proximal Policy Optimization)**| Clipped Surrogate Actor-Critic | $L^{\text{CLIP}}(\theta) = \hat{\mathbb{E}}_t \left[ \min\left(r_t(\theta)\hat{A}_t, \, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\hat{A}_t\right) \right]$ |
| 7 | **DQN (Deep Q-Network)** | Deep Value-Based | Experience Replay Buffer $\mathcal{D}$ + Target Network $\bar{\theta}$ with Huber / MSE loss |
| 8 | **Double DQN (DDQN)** | Deep Value-Based | Decoupled action selection and evaluation: $y = r + \gamma Q(s', \arg\max_{a'} Q(s', a'; \theta); \bar{\theta})$ |
| 9 | **DDPG** | Deterministic Actor-Critic | Off-policy continuous actor $\mu_\theta(s)$, critic $Q_\phi(s, a)$, and Polyak soft target updates |

---

## ✨ Key Features

- **Live Animated Checkout Lanes**: 3 animated checkout lanes displaying customer avatars, service progress bars, and instantaneous cashier speed indicators ($\mu_0=0.6, \mu_1=0.4, \mu_2=0.3$).
- **Policy Decision Matrix & Value Heatmaps**: 2D slice visualizer showing optimal action choices and Max $Q$-value surface across queue states.
- **SimPy Discrete-Event Simulation Arena**: Continuous-time simulation comparing real-time queues, customer wait histograms, and lane throughput.
- **Comparative Analysis Hub**: Side-by-side benchmark radar plots, cumulative wait comparison, and fairness metrics across all 9 RL algorithms and baseline heuristics.
- **Interactive Dispatch & Auto-Play**: Step-by-step customer injection, batch simulation, and dynamic parameter tuning ($\alpha, \gamma, \epsilon$, cashier rates).
- **Downloadable Logs**: Full export of transition tuples $(s, a, r, s', \Delta Q)$ to CSV for external research and validation.

---

## 🏗️ System Architecture

```
Autonomous-Retail-Checkout-Queue-Optimizer-SimPy/
├── backend/
│   ├── app.py                     # Flask REST API server & endpoints
│   ├── simulation_engine.py       # Core MDP simulation & dispatch engine
│   ├── simpy_engine.py            # SimPy continuous-time event simulator
│   ├── models/                    # RL algorithm implementations
│   │   ├── __init__.py            # Model registry & unified dispatcher
│   │   ├── base.py                # Base RL agent class
│   │   ├── q_learning.py          # Tabular Q-Learning
│   │   ├── sarsa.py               # SARSA
│   │   ├── bandit.py              # Contextual UCB1 Bandit
│   │   ├── reinforce.py           # REINFORCE with baseline
│   │   ├── a2c.py                 # Advantage Actor-Critic
│   │   ├── ppo.py                 # Proximal Policy Optimization
│   │   ├── dqn.py                 # Deep Q-Network
│   │   ├── double_dqn.py          # Double DQN
│   │   ├── ddpg.py                # Deep Deterministic Policy Gradient
│   │   └── neural_net.py          # PyTorch-free lightweight neural networks
│   └── q_learning_plots/          # Precomputed plots & visual assets
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main application dashboard
│   │   ├── api.js                 # Axios API service client
│   │   ├── index.css              # Custom styling & glassmorphism theme
│   │   └── components/
│   │       ├── CheckoutLanesView.jsx     # Live checkout counters
│   │       ├── PolicyStudioView.jsx      # Policy heatmaps & Q-surfaces
│   │       ├── ComparativeAnalysisView.jsx # Multi-model analytics hub
│   │       ├── SimPyView.jsx             # Discrete-event simulation
│   │       ├── BenchmarkLogsView.jsx     # 100-step leaderboard & logs
│   │       ├── OverviewView.jsx          # KPI cards & system overview
│   │       ├── SimulationControls.jsx    # Step/auto controls & model switcher
│   │       ├── ConfigModal.jsx           # Hyperparameter tuning modal
│   │       └── Sidebar.jsx               # Navigation bar
├── start.bat                      # One-click Windows starter
├── push_to_github.bat             # GitHub push script
└── RUN_GUIDE.md                   # Operational guide
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+**
- **Node.js 18+ and npm**

### Option A: One-Click Launch (Windows)
Double-click `start.bat` in the project root directory. Both the backend API and frontend Vite server will launch automatically in separate terminal windows.

### Option B: Manual Startup

**1. Launch Backend API:**
```bash
python backend/app.py
```
*API will be available at `http://127.0.0.1:5000`*

**2. Launch Frontend UI:**
```bash
cd frontend
npm install
npm run dev
```
*Access the dashboard at `http://localhost:5173`*

**3. Run SimPy Standalone Benchmark:**
```bash
python backend/simpy_engine.py
```

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/status` | `GET` | Environment status, active model ID, and current queue state |
| `/api/models` | `GET` | Metadata, tags, and architectures for all 9 RL algorithms |
| `/api/models/select` | `POST` | Switches the active model (`{ "modelId": "ppo" }`) |
| `/api/benchmark` | `POST` | Multi-model 100-step benchmark comparing wait times & rewards |
| `/api/interactive/step` | `POST` | Steps simulation by 1 arrival using current policy or heuristic |
| `/api/interactive/reset`| `POST` | Resets interactive queue state to $(0, 0, 0)$ |
| `/api/policy` | `GET` | Returns 6x6 policy matrix and value surface slice |
| `/api/q_values` | `POST` | Returns action values/probabilities for given state $(q_0, q_1, q_2)$ |
| `/api/simpy/run` | `POST` | Runs continuous-time SimPy discrete-event simulation |
| `/api/train` | `POST` | Trains selected model with custom hyperparameters |

---

## 📊 Benchmark Results

| Strategy | Total Wait (steps) | Mean Queue Length | Bottleneck Ratio | Wait Reduction vs Random |
|---|---|---|---|---|
| **Random Baseline** | ~381 | 3.81 | High | Baseline (0%) |
| **Shortest Queue Heuristic** | ~305 | 3.05 | Moderate | ~19.9% |
| **Tabular Q-Learning** | ~268 | 2.68 | Low | **~29.7%** |
| **Double DQN** | ~254 | 2.54 | Minimal | **~33.3%** |
| **PPO** | ~248 | 2.48 | Minimal | **~34.9%** |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
