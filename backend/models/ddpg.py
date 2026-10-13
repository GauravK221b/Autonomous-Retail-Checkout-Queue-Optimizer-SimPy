import numpy as np
from .base import BaseQueueAgent
from .neural_net import MLP, ReplayBuffer

class DDPGAgent(BaseQueueAgent):
    """
    DDPG (Deep Deterministic Policy Gradient - Lillicrap et al. 2015).
    - Deterministic Actor Network: mu(s) producing lane dispatch preferences
    - Critic Network: Q(s, a) evaluating state-action quality
    - Target Networks with Polyak soft parameter updates (tau)
    - Action exploration via Gaussian perturbation noise
    """
    def __init__(self, num_counters=3, max_queue_len=5, gamma=0.95,
                 lr_actor=0.003, lr_critic=0.006, tau=0.02, noise_std=0.2,
                 batch_size=32):
        super().__init__("DDPG", "actor_critic", num_counters, max_queue_len)
        self.gamma = gamma
        self.tau = tau
        self.noise_std = noise_std
        self.min_noise_std = 0.05
        self.noise_decay = 0.995
        self.batch_size = batch_size

        input_dim = 5  # normalized queue features
        # Actor outputs continuous dispatch preference for each of the 3 counters
        self.actor = MLP(input_dim=input_dim, hidden_dim=32, output_dim=num_counters, lr=lr_actor, activation_out="tanh")
        self.actor_target = MLP(input_dim=input_dim, hidden_dim=32, output_dim=num_counters, lr=lr_actor, activation_out="tanh")
        self.actor_target.copy_weights_from(self.actor, tau=1.0)

        # Critic inputs: state_features (5) + one-hot action (3) = 8 dims -> scalar Q(s, a)
        self.critic = MLP(input_dim=input_dim + num_counters, hidden_dim=32, output_dim=1, lr=lr_critic)
        self.critic_target = MLP(input_dim=input_dim + num_counters, hidden_dim=32, output_dim=1, lr=lr_critic)
        self.critic_target.copy_weights_from(self.critic, tau=1.0)

        self.replay_buffer = ReplayBuffer(capacity=2500)

    def _to_one_hot(self, actions):
        if np.isscalar(actions):
            oh = np.zeros(self.num_counters, dtype=np.float32)
            oh[int(actions)] = 1.0
            return oh
        oh = np.zeros((len(actions), self.num_counters), dtype=np.float32)
        for i, a in enumerate(actions):
            oh[i, int(a)] = 1.0
        return oh

    def choose_action(self, state, explore=True):
        feat = self.state_features(state)
        prefs = self.actor.forward(feat)[0]
        if explore:
            noise = np.random.normal(0, self.noise_std, size=self.num_counters)
            prefs = prefs + noise
        return int(np.argmax(prefs))

    def update(self, state, action, reward, next_state):
        feat = self.state_features(state)
        next_feat = self.state_features(next_state)
        self.replay_buffer.push(feat, action, reward, next_feat)

        if len(self.replay_buffer) >= self.batch_size:
            states, actions, rewards, next_states = self.replay_buffer.sample(self.batch_size)

            # 1. Target Q calculation: y = r + gamma * Q_target(s', mu_target(s'))
            target_prefs = self.actor_target.forward(next_states)
            target_actions = np.argmax(target_prefs, axis=1)
            target_actions_oh = self._to_one_hot(target_actions)

            next_sa = np.hstack([next_states, target_actions_oh])
            target_q = self.critic_target.forward(next_sa).reshape(-1)
            y = rewards + self.gamma * target_q

            # 2. Update Critic: minimize MSE (Q(s, a) - y)^2
            actions_oh = self._to_one_hot(actions)
            sa = np.hstack([states, actions_oh])
            pred_q = self.critic.forward(sa).reshape(-1)
            critic_grad = (pred_q - y).reshape(-1, 1)
            self.critic.backward(critic_grad)

            # 3. Update Actor using deterministic policy gradient:
            # Gradient ascent on Q(s, mu(s))
            current_prefs = self.actor.forward(states)
            actor_actions = np.argmax(current_prefs, axis=1)
            actor_actions_oh = self._to_one_hot(actor_actions)
            actor_sa = np.hstack([states, actor_actions_oh])

            # Perturbation gradient
            actor_grad = -np.ones_like(current_prefs) * 0.1
            for i in range(self.batch_size):
                actor_grad[i, actor_actions[i]] = -1.0
            self.actor.backward(actor_grad)

            # 4. Soft target updates (Polyak averaging)
            self.actor_target.copy_weights_from(self.actor, tau=self.tau)
            self.critic_target.copy_weights_from(self.critic, tau=self.tau)

    def decay_epsilon(self):
        self.noise_std = max(self.min_noise_std, self.noise_std * self.noise_decay)

    def get_action_values(self, state):
        feat = self.state_features(state)
        vals = []
        for a in range(self.num_counters):
            a_oh = self._to_one_hot(a)
            sa = np.hstack([feat, a_oh])
            q_val = float(self.critic.forward(sa)[0, 0])
            vals.append(q_val)
        return vals
