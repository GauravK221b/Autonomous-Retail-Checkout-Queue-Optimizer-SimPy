# Autonomous Retail Checkout Queue Optimizer

An intelligent queue routing and dispatching system using **Tabular Q-Learning (Off-Policy 1-Step Temporal Difference Control)** to dynamically allocate incoming retail customers across asymmetric checkout counters.

---

## 📌 Overview

In retail supermarket environments with multiple checkout counters possessing non-homogeneous cashier service speeds ($\mu_i$), static or random customer allocation leads to queue imbalances, long waiting times, and severe counter congestion. 

This repository implements a model-free Reinforcement Learning agent that learns an optimal customer dispatching policy directly from step-by-step state transitions without requiring prior knowledge of customer arrival patterns or service rate distributions.

---

## ⚙️ Problem Formulation & Environment Design

- **State Space ($S$)**: Discrete 3D queue length tuple $(q_0, q_1, q_2)$ where each $q_i \in \{0, 1, 2, 3, 4, 5\}$ represents the active queue length at Counter $i$. Total states: $6^3 = 216$.
- **Action Space ($A$)**: Discrete set $A \in \{0, 1, 2\}$, corresponding to routing an arriving customer to Lane 0, Lane 1, or Lane 2.
- **Service Departure Probabilities ($\mu$)**:
  - Lane 0 (Fast): $\mu_0 = 0.60$
  - Lane 1 (Mid): $\mu_1 = 0.40$
  - Lane 2 (Slow): $\mu_2 = 0.30$
- **Reward Function ($R$)**:
  $$R(s, a) = - \left( \sum_{i=0}^2 q_i + 0.5 \times \text{Var}(q) \right)$$
  Penalizes total active customers waiting across all lines ($R_{\text{wait}}$) as well as workload variance across cashiers ($R_{\text{imb}}$).

---

## 🤖 Reinforcement Learning Algorithm (Q-Learning)

The agent estimates the optimal action-value function $Q^*(s, a)$ using **Tabular Q-Learning**:

$$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha \left[ R_{t+1} + \gamma \max_{a} Q(S_{t+1}, a) - Q(S_t, A_t) \right]$$

### Hyperparameters
- **Learning Rate ($\alpha$)**: $0.10$
- **Discount Factor ($\gamma$)**: $0.95$
- **Exploration Policy ($\epsilon$-greedy)**: Initial $\epsilon = 0.40$, decay rate $= 0.995$, minimum $\epsilon = 0.05$
- **Training Duration**: 250 episodes (25 steps per episode)

---

## 📊 Benchmark Results

Evaluating the trained Q-Learning RL agent against a baseline random routing strategy over a 100-timestep simulation:

| Metric | Baseline Random Allocation | Q-Learning RL Optimizer | Improvement |
| :--- | :---: | :---: | :---: |
| **Total Customer Wait-Units** | **381** | **268** | **-113 Wait-Units** |
| **Queue Congestion Reduction** | - | - | **29.66% Reduction** |

---

## 📈 Visualizations & Policy Heatmaps

The training process generates several visualizations saved in `q_learning_plots/`:

- **Training Progress**: Cumulative episodic reward and 10-episode moving average.
- **Q-Value Heatmaps**: Slice of max $Q(s, a)$ values across queue length combinations.
- **Initial vs. Final Policy Comparison**: Comparison heatmaps showing initial random assignment vs. learned optimal dispatching policy.
- **Store Load Over Time**: Total customers in queue across simulation steps.

---

## 📁 Repository Structure

```text
├── Q_Learning.ipynb                     # Interactive Jupyter Notebook for Q-Learning
├── generate_q_learning_experiment.py    # Python script to train agent & generate plots
├── create_q_learning_docx.py            # Python script to populate Word lab report
├── RL_EXP_Q_Learning_23BAI1083.docx     # Formatted Word Lab Report
├── q_learning_plots/                    # Generated plots & heatmaps
│   ├── training_progress.png
│   ├── updated_max_q.png
│   ├── live_queue_dispatch.png
│   ├── initial_vs_final_policy.png
│   └── total_customer_over_time.png
├── README.md                            # Project Documentation
└── .gitignore                           # Git ignore rules
```

---

## 🚀 How to Run

### Prerequisites
```bash
pip install numpy matplotlib seaborn python-docx pygments
```

### Run Q-Learning Training & Plot Generation
```bash
python generate_q_learning_experiment.py
```

### Generate Lab Report Word Document
```bash
python create_q_learning_docx.py
```

---

## 👤 Author
**Kulin Mathur**  
Reg No: `23BAI1083`  
School of Computer Science and Engineering (SCOPE)
