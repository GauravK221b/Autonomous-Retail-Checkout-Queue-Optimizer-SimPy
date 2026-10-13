import numpy as np
from .base import BaseQueueAgent
from .neural_net import MLP, ReplayBuffer

class DoubleDQNAgent(BaseQueueAgent):
    """
    Double DQN (DDQN - van Hasselt et al. 2015).
    Eliminates Q-value maximization overestimation bias by decoupling
    greedy action selection (online network) from action evaluation (target network):
       a* = argmax_a Q_online(s', a)
       target = r + gamma * Q_target(s', a*)
    """
    def __init__(self, num_counters=3, max_queue_len=5, gamma=0.95, lr=0.005,
                 epsilon=0.4, epsilon_decay=0.995, min_epsilon=0.05,
                 batch_size=32, target_update_freq=10):
        super().__init__("Double DQN", "deep_rl", num_counters, max_queue_len)
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.min_epsilon = min_epsilon
        self.batch_size = batch_size
        self.target_update_freq = target_update_freq
        self.step_count = 0

        input_dim = 5
        self.q_net = MLP(input_dim=input_dim, hidden_dim=32, output_dim=num_counters, lr=lr)
        self.target_net = MLP(input_dim=input_dim, hidden_dim=32, output_dim=num_counters, lr=lr)
        self.target_net.copy_weights_from(self.q_net, tau=1.0)

        self.replay_buffer = ReplayBuffer(capacity=2500)

    def choose_action(self, state, explore=True):
        if explore and np.random.rand() < self.epsilon:
            return int(np.random.choice(self.num_counters))
        feat = self.state_features(state)
        q_vals = self.q_net.forward(feat)[0]
        return int(np.argmax(q_vals))

    def update(self, state, action, reward, next_state):
        feat = self.state_features(state)
        next_feat = self.state_features(next_state)
        self.replay_buffer.push(feat, action, reward, next_feat)
        self.step_count += 1

        if len(self.replay_buffer) >= self.batch_size:
            states, actions, rewards, next_states = self.replay_buffer.sample(self.batch_size)

            # Double Q trick:
            # 1. Action selection using ONLINE network: a* = argmax_a Q_online(s', a)
            next_q_online = self.q_net.forward(next_states)
            best_next_actions = np.argmax(next_q_online, axis=1)

            # 2. Action evaluation using TARGET network: Q_target(s', a*)
            next_q_target = self.target_net.forward(next_states)
            double_q_values = next_q_target[np.arange(self.batch_size), best_next_actions]

            targets = rewards + self.gamma * double_q_values

            # Current predictions
            current_q = self.q_net.forward(states)

            # Gradient update on chosen action
            grad = np.zeros_like(current_q)
            for i in range(self.batch_size):
                a = actions[i]
                td_error = current_q[i, a] - targets[i]
                grad[i, a] = td_error

            self.q_net.backward(grad)

        if self.step_count % self.target_update_freq == 0:
            self.target_net.copy_weights_from(self.q_net, tau=0.1)

    def decay_epsilon(self):
        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)

    def get_action_values(self, state):
        feat = self.state_features(state)
        q_vals = self.q_net.forward(feat)[0]
        return [float(v) for v in q_vals]
