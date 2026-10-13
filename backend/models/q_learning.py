import numpy as np
from .base import BaseQueueAgent

class QLearningAgent(BaseQueueAgent):
    """
    Tabular Q-Learning (Off-Policy 1-Step Temporal Difference Control).
    Update: Q(S, A) <- Q(S, A) + alpha * [R + gamma * max_a' Q(S', a') - Q(S, A)]
    """
    def __init__(self, num_counters=3, max_queue_len=5, gamma=0.95, alpha=0.1,
                 epsilon=0.4, epsilon_decay=0.995, min_epsilon=0.05):
        super().__init__("Q-Learning", "value_based", num_counters, max_queue_len)
        self.gamma = gamma
        self.alpha = alpha
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.min_epsilon = min_epsilon

        # Q-table: (6, 6, 6, 3)
        self.Q = np.zeros(self.state_shape + (self.num_counters,), dtype=np.float64)
        self.policy = np.random.choice(self.num_counters, size=self.state_shape)

    def choose_action(self, state, explore=True):
        state = tuple(int(x) for x in state)
        if explore and np.random.rand() < self.epsilon:
            return int(np.random.choice(self.num_counters))
        return int(np.argmax(self.Q[state]))

    def update(self, state, action, reward, next_state):
        state = tuple(int(x) for x in state)
        next_state = tuple(int(x) for x in next_state)
        best_next_action = np.argmax(self.Q[next_state])
        td_target = reward + self.gamma * self.Q[next_state][best_next_action]
        td_error = td_target - self.Q[state][action]
        self.Q[state][action] += self.alpha * td_error
        self.policy[state] = np.argmax(self.Q[state])

    def decay_epsilon(self):
        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)

    def get_action_values(self, state):
        state = tuple(int(x) for x in state)
        return [float(v) for v in self.Q[state]]
