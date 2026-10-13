import numpy as np
from .base import BaseQueueAgent

class ContextualBanditAgent(BaseQueueAgent):
    """
    Multi-Armed Bandit with UCB1 (Upper Confidence Bound) and Contextual Arm Payoffs.
    Arms: {0: Counter 0 (Fast), 1: Counter 1 (Mid), 2: Counter 2 (Slow)}
    Decision rule:
       a = argmax_a [ mu(s, a) + c * sqrt(ln(N(s) + 1) / (N(s, a) + 1)) ]
    Serves as an adaptive, zero-discount (gamma=0) immediate-reward baseline.
    """
    def __init__(self, num_counters=3, max_queue_len=5, c_param=1.2, epsilon=0.1):
        super().__init__("Multi-Armed Bandit", "bandit", num_counters, max_queue_len)
        self.c_param = c_param
        self.epsilon = epsilon

        # State-action counts and mean estimated rewards
        self.counts = np.zeros(self.state_shape + (self.num_counters,), dtype=np.int32)
        self.rewards = np.zeros(self.state_shape + (self.num_counters,), dtype=np.float64)

        # Global arm counters
        self.global_counts = np.zeros(self.num_counters, dtype=np.int32)
        self.global_rewards = np.zeros(self.num_counters, dtype=np.float64)

    def choose_action(self, state, explore=True):
        state = tuple(int(x) for x in state)
        if explore and np.random.rand() < self.epsilon:
            return int(np.random.choice(self.num_counters))

        total_n = np.sum(self.counts[state])
        if total_n == 0:
            # Unvisited state: prioritize lane with shortest active queue
            return int(np.argmin(state))

        # UCB1 score for each arm
        ucb_values = np.zeros(self.num_counters)
        for a in range(self.num_counters):
            n_a = self.counts[state][a]
            if n_a == 0:
                ucb_values[a] = 1e6  # Ensure all arms are pulled at least once
            else:
                bonus = self.c_param * np.sqrt(np.log(total_n + 1.0) / (n_a))
                ucb_values[a] = self.rewards[state][a] + bonus

        return int(np.argmax(ucb_values))

    def update(self, state, action, reward, next_state=None):
        state = tuple(int(x) for x in state)
        # Update state-specific estimates
        self.counts[state][action] += 1
        n = self.counts[state][action]
        # Incremental mean update: mu <- mu + (R - mu) / n
        self.rewards[state][action] += (reward - self.rewards[state][action]) / n

        # Update global arm stats
        self.global_counts[action] += 1
        gn = self.global_counts[action]
        self.global_rewards[action] += (reward - self.global_rewards[action]) / gn

    def get_action_values(self, state):
        state = tuple(int(x) for x in state)
        total_n = np.sum(self.counts[state])
        # Return expected reward + UCB exploration score
        vals = []
        for a in range(self.num_counters):
            n_a = self.counts[state][a]
            if n_a == 0:
                vals.append(float(self.global_rewards[a]))
            else:
                bonus = self.c_param * np.sqrt(np.log(total_n + 1.0) / (n_a))
                vals.append(float(self.rewards[state][a] + bonus))
        return vals
