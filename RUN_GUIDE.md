# 🛒 OptiQueue AI - Autonomous Retail Checkout Queue Optimizer

A modern, full-stack retail queue analytics dashboard powered by **Tabular Q-Learning (Off-Policy 1-Step TD Control)** and **SimPy Discrete-Event Simulation**.

---

## 🌟 Reinforcement Learning Model Spectrum

OptiQueue AI includes 9 distinct reinforcement learning architectures:

1. **Tabular Q-Learning**: Value-based off-policy 1-step TD control estimating $Q^*(s, a)$.
2. **SARSA**: Value-based on-policy TD control accounting for exploratory actions, resulting in safer conservative queue boundaries.
3. **Multi-Armed Bandit (Contextual UCB1)**: Adaptive arm-selection baseline balancing exploitation and exploration bonuses without discount factors.
4. **REINFORCE (with Baseline)**: Episodic Monte Carlo policy gradient optimizing softmax action preferences with a learned state-value baseline $V(s)$.
5. **A2C (Advantage Actor-Critic)**: Synchronous actor-critic updating policy preferences and state-value baseline simultaneously via 1-step TD advantage.
6. **PPO (Proximal Policy Optimization)**: State-of-the-art actor-critic using clipped surrogate objective $L^{\text{CLIP}}(\theta)$ and Generalized Advantage Estimation (GAE) to prevent destructive policy degradation.
7. **DQN (Deep Q-Network)**: Deep neural function approximation with Experience Replay Buffer and periodic Target Network updates.
8. **Double DQN (DDQN)**: Decouples online greedy action selection from target network evaluation to eliminate maximization overestimation bias.
9. **DDPG (Deep Deterministic Policy Gradient)**: Off-policy actor-critic using deterministic policy gradients, continuous action evaluation, and Polyak soft updates.

---

## 🚀 How to Run the Project

### Prerequisites
- **Python 3.9+**
- **Node.js 18+ and npm**

### 1. One-Click Launch (Windows)
Double-click `start.bat` in the repository root to start both the Python backend and React frontend automatically.

### 2. Manual Startup
**Backend API:**
```bash
python backend/app.py
```
*API running at: `http://127.0.0.1:5000`*

**Frontend UI:**
```bash
cd frontend
npm install
npm run dev
```
*Web dashboard running at: `http://localhost:5173`*

**SimPy Terminal Arena:**
```bash
python backend/simpy_engine.py
```

---

## 📡 API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/status` | `GET` | Environment status, active model, and list of all 6 available RL algorithms |
| `/api/models` | `GET` | Metadata, tags, and architectures for all implemented models |
| `/api/models/select` | `POST` | Sets the active dispatch model (`modelId`) |
| `/api/benchmark` | `POST` | 100-step multi-model benchmark leaderboard comparing all 6 RL models vs baselines |
| `/api/interactive/step` | `POST` | Dispatches 1 customer arrival using selected RL model, heuristic, or manual action |
| `/api/interactive/reset` | `POST` | Resets interactive checkout queues |
| `/api/policy?modelId=ppo&fixedLane2=0` | `GET` | Returns 6x6 policy decision matrix and value surface for any algorithm |
| `/api/q_values` | `POST` | Returns action values/probabilities for any state $(q_0, q_1, q_2)$ under any model |
| `/api/simpy/run` | `POST` | Executes continuous-time SimPy discrete-event simulation comparing all 8 strategies |
| `/api/train` | `POST` | Retrains any specific model or all models with custom hyperparameters |
