import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import time
import os

# Set seed for reproducibility
np.random.seed(42)

# Environment Definition
class RetailQueueEnv:
    def __init__(self, num_counters=3, max_queue_len=5, service_rates=[0.6, 0.4, 0.3]):
        self.num_counters = num_counters
        self.max_queue_len = max_queue_len
        self.service_rates = service_rates
        self.reset()

    def reset(self):
        self.queues = np.random.randint(0, 3, size=self.num_counters)
        return tuple(self.queues)

    def step(self, action):
        if self.queues[action] < self.max_queue_len:
            self.queues[action] += 1

        for i in range(self.num_counters):
            if self.queues[i] > 0 and np.random.rand() < self.service_rates[i]:
                self.queues[i] -= 1

        total_waiting = np.sum(self.queues)
        imbalance_penalty = np.var(self.queues)
        reward = -(total_waiting + 0.5 * imbalance_penalty)
        next_state = tuple(self.queues)
        return next_state, reward

# Q-Learning Agent Definition
class QLearningQueueOptimizer:
    def __init__(self, num_counters=3, max_queue_len=5, gamma=0.95, alpha=0.1, epsilon=0.4, epsilon_decay=0.995, min_epsilon=0.05):
        self.num_counters = num_counters
        self.max_queue_len = max_queue_len
        self.gamma = gamma
        self.alpha = alpha
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.min_epsilon = min_epsilon

        state_dim = tuple([self.max_queue_len + 1] * self.num_counters)
        self.Q = np.zeros(state_dim + (self.num_counters,))
        self.policy = np.random.choice(self.num_counters, size=state_dim)

    def choose_action(self, state, explore=True):
        if explore and np.random.rand() < self.epsilon:
            return np.random.choice(self.num_counters)
        return np.argmax(self.Q[state])

    def update(self, state, action, reward, next_state):
        best_next_action = np.argmax(self.Q[next_state])
        td_target = reward + self.gamma * self.Q[next_state][best_next_action]
        td_error = td_target - self.Q[state][action]
        self.Q[state][action] += self.alpha * td_error
        self.policy[state] = np.argmax(self.Q[state])

    def decay_epsilon(self):
        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)

# Execution
env = RetailQueueEnv(num_counters=3, max_queue_len=5, service_rates=[0.6, 0.4, 0.3])
agent = QLearningQueueOptimizer(num_counters=3, max_queue_len=5, gamma=0.95, alpha=0.1, epsilon=0.4)

initial_policy_snapshot = np.copy(agent.policy)

num_episodes = 250
episode_rewards = []
last_episode = []

for ep in range(1, num_episodes + 1):
    state = env.reset()
    total_ep_reward = 0
    ep_history = []
    for _ in range(25):
        action = agent.choose_action(state, explore=True)
        next_state, reward = env.step(action)
        agent.update(state, action, reward, next_state)
        total_ep_reward += reward
        ep_history.append((state, action, reward))
        state = next_state
    agent.decay_epsilon()
    episode_rewards.append(total_ep_reward)
    if ep == num_episodes:
        last_episode = ep_history

output_dir = 'q_learning_plots'
os.makedirs(output_dir, exist_ok=True)

# Plot 1: Training Progress
plt.figure(figsize=(7, 5), dpi=300)
plt.plot(range(1, len(episode_rewards) + 1), episode_rewards, color='royalblue', alpha=0.4, label='Raw Return')
if len(episode_rewards) >= 10:
    smooth_rewards = np.convolve(episode_rewards, np.ones(10)/10, mode='valid')
    plt.plot(range(10, len(episode_rewards) + 1), smooth_rewards, color='firebrick', lw=2, label='10-Ep Moving Avg')
plt.title(f"Training Progress (Episode {num_episodes}/{num_episodes})", fontweight='bold')
plt.xlabel("Episode")
plt.ylabel("Total Cumulative Reward")
plt.grid(True, linestyle='--', alpha=0.6)
plt.legend()
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'training_progress.png'))
plt.close()

# Plot 2: Updated Max Q(s, a) Slice
plt.figure(figsize=(7, 5), dpi=300)
q_slice = np.max(agent.Q[:, :, 0, :], axis=-1)
sns.heatmap(q_slice, annot=True, fmt=".1f", cmap="magma", cbar=True)
plt.title(r"Updated Max $Q(s, a)$ Slice (Lane 2 = 0)", fontweight='bold')
plt.xlabel("Counter 1 Queue Length")
plt.ylabel("Counter 0 Queue Length")
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'updated_max_q.png'))
plt.close()

# Plot 3: Live Queue Dispatch
plt.figure(figsize=(7, 5), dpi=300)
current_state = last_episode[-1][0]
chosen_action = last_episode[-1][1]
bars = plt.bar([f"Lane 0\n(Fast: $\\mu$=0.6)", f"Lane 1\n(Mid: $\\mu$=0.4)", f"Lane 2\n(Slow: $\\mu$=0.3)"],
               current_state, color=['#2ca02c', '#1f77b4', '#ff7f0e'], edgecolor='black', width=0.5)
plt.ylim(0, env.max_queue_len + 1)
plt.ylabel("Active Customers")
plt.title(f"Live Queue Dispatch (Action: Routed to Lane {chosen_action})", fontweight='bold')
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'live_queue_dispatch.png'))
plt.close()

# Plot 4: Initial vs Final Policy
fig, axes = plt.subplots(1, 2, figsize=(12, 5), dpi=300)
fixed_q2 = 1
sns.heatmap(initial_policy_snapshot[:, :, fixed_q2], annot=True, cmap="Set3", cbar=False, ax=axes[0], linewidths=1, linecolor='gray')
axes[0].set_title(f"Initial (Untrained / Random) Policy\n[Fixed Lane 2 = {fixed_q2}]", fontsize=11, fontweight='bold')
axes[0].set_xlabel("Counter 1 Queue Length")
axes[0].set_ylabel("Counter 0 Queue Length")

sns.heatmap(agent.policy[:, :, fixed_q2], annot=True, cmap="Accent", cbar=False, ax=axes[1], linewidths=1, linecolor='gray')
axes[1].set_title(f"Final Optimized Policy (Q-Learning)\n[Fixed Lane 2 = {fixed_q2}]", fontsize=11, fontweight='bold')
axes[1].set_xlabel("Counter 1 Queue Length")
axes[1].set_ylabel("Counter 0 Queue Length")
plt.suptitle("Policy Decision Comparison (Values represent Target Lane: 0, 1, or 2)", fontsize=13, y=1.02)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'initial_vs_final_policy.png'))
plt.close()

# Evaluation Benchmark
def evaluate_policy(env, agent=None, steps=100):
    env.reset()
    total_wait_time = 0
    history = []
    for _ in range(steps):
        state = tuple(env.queues)
        if agent is None:
            action = np.random.choice(env.num_counters)
        else:
            action = np.argmax(agent.Q[state])
        next_state, reward = env.step(action)
        total_wait_time += np.sum(next_state)
        history.append(list(next_state))
    return total_wait_time, np.array(history)

np.random.seed(42)
rand_wait, rand_hist = evaluate_policy(env, agent=None, steps=100)
np.random.seed(42)
opt_wait, opt_hist = evaluate_policy(env, agent=agent, steps=100)

pct_reduction = ((rand_wait - opt_wait) / rand_wait) * 100
print(f"BENCHMARK RESULTS OVER 100 TIMESTEPS:")
print(f"Total Customer Wait-Units (Baseline Random): {rand_wait}")
print(f"Total Customer Wait-Units (Q-Learning RL): {opt_wait}")
print(f"Queue Congestion Reduction: {pct_reduction:.2f}%")

# Plot 5: Total Customer Over Time
plt.figure(figsize=(10, 4.5), dpi=300)
plt.plot(np.sum(rand_hist, axis=1), label='Random Baseline Queue Load', color='red', linestyle='--', alpha=0.7)
plt.plot(np.sum(opt_hist, axis=1), label='Q-Learning Optimized Queue Load', color='green', lw=2)
plt.title("Total Customers in Store Over Time", fontsize=13, fontweight='bold')
plt.xlabel("Simulation Steps")
plt.ylabel("Total Queue Length")
plt.legend()
plt.grid(True, linestyle='--', alpha=0.5)
plt.tight_layout()
plt.savefig(os.path.join(output_dir, 'total_customer_over_time.png'))
plt.close()
