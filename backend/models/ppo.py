import numpy as np
from .base import BaseQueueAgent

class PPOAgent(BaseQueueAgent):
    """
    Proximal Policy Optimization (PPO - Clipped Surrogate Objective).
    Actor: Policy logits theta(s, a) producing pi_theta(a|s).
    Critic: Value function V(s).
    Clipped Surrogate Loss:
       r_t(theta) = pi_theta(a_t|s_t) / pi_old(a_t|s_t)
       L_clip = min(r_t * A_t, clip(r_t, 1-eps, 1+eps) * A_t)
    Optimizes across multiple epochs per batch with GAE (Generalized Advantage Estimation).
    """
    def __init__(self, num_counters=3, max_queue_len=5, gamma=0.95, gae_lambda=0.95,
                 clip_eps=0.2, lr_actor=0.03, lr_critic=0.06, epochs=4, entropy_coef=0.01):
        super().__init__("PPO (Proximal Policy Optimization)", "actor_critic", num_counters, max_queue_len)
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_eps = clip_eps
        self.lr_actor = lr_actor
        self.lr_critic = lr_critic
        self.epochs = epochs
        self.entropy_coef = entropy_coef

        # Actor parameters theta(s, a): (6, 6, 6, 3)
        self.theta = np.zeros(self.state_shape + (self.num_counters,), dtype=np.float64)
        # Critic state values V(s): (6, 6, 6)
        self.V = np.zeros(self.state_shape, dtype=np.float64)

        # Rollout buffer
        self.buffer_states = []
        self.buffer_actions = []
        self.buffer_rewards = []
        self.buffer_next_states = []
        self.buffer_old_probs = []

    def get_action_probabilities(self, state, theta=None):
        state = tuple(int(x) for x in state)
        pref = self.theta[state] if theta is None else theta[state]
        shift = pref - np.max(pref)
        exp_v = np.exp(shift)
        return (exp_v / np.sum(exp_v)).tolist()

    def choose_action(self, state, explore=True):
        probs = self.get_action_probabilities(state)
        if explore:
            action = int(np.random.choice(self.num_counters, p=probs))
        else:
            action = int(np.argmax(probs))
        return action

    def store_step(self, state, action, reward, next_state):
        state = tuple(int(x) for x in state)
        next_state = tuple(int(x) for x in next_state)
        probs = self.get_action_probabilities(state)
        old_prob = probs[action]

        self.buffer_states.append(state)
        self.buffer_actions.append(action)
        self.buffer_rewards.append(float(reward))
        self.buffer_next_states.append(next_state)
        self.buffer_old_probs.append(float(old_prob))

    def update(self, state, action, reward, next_state):
        self.store_step(state, action, reward, next_state)

    def optimize_batch(self):
        """Runs PPO clipped surrogate optimization over the trajectory."""
        n = len(self.buffer_rewards)
        if n == 0:
            return

        # 1. Compute GAE (Generalized Advantage Estimation) & Returns
        advantages = np.zeros(n, dtype=np.float64)
        returns = np.zeros(n, dtype=np.float64)
        gae = 0.0

        for t in reversed(range(n)):
            s = self.buffer_states[t]
            s_next = self.buffer_next_states[t]
            r = self.buffer_rewards[t]

            delta = r + self.gamma * self.V[s_next] - self.V[s]
            gae = delta + self.gamma * self.gae_lambda * gae
            advantages[t] = gae
            returns[t] = gae + self.V[s]

        # Normalize advantages for training stability
        adv_std = np.std(advantages)
        if adv_std > 1e-8:
            norm_advantages = (advantages - np.mean(advantages)) / (adv_std + 1e-8)
        else:
            norm_advantages = advantages

        # 2. PPO Multiple Epoch Updates
        for _ in range(self.epochs):
            for t in range(n):
                s = self.buffer_states[t]
                a = self.buffer_actions[t]
                old_p = max(1e-8, self.buffer_old_probs[t])
                adv = norm_advantages[t]
                ret = returns[t]

                # Update Critic (MSE loss)
                c_error = ret - self.V[s]
                self.V[s] += self.lr_critic * c_error

                # Current policy prob
                curr_probs = np.array(self.get_action_probabilities(s), dtype=np.float64)
                curr_p = max(1e-8, curr_probs[a])

                # Importance sampling ratio
                ratio = curr_p / old_p
                clipped_ratio = np.clip(ratio, 1.0 - self.clip_eps, 1.0 + self.clip_eps)

                # Clipped surrogate objective gradient:
                # If ratio*adv <= clipped*adv, take standard gradient; else clip gradient to 0
                surr1 = ratio * adv
                surr2 = clipped_ratio * adv

                if surr1 <= surr2 or (adv > 0 and ratio < 1.0 + self.clip_eps) or (adv < 0 and ratio > 1.0 - self.clip_eps):
                    # Policy gradient: grad_theta = (1/old_p) * grad_pi = (1_{a} - pi) * (curr_p / old_p)
                    grad = -curr_probs
                    grad[a] += 1.0
                    actor_step = ratio * adv * grad
                else:
                    # Clipped: gradient is 0
                    actor_step = np.zeros(self.num_counters)

                # Entropy regularization
                log_p = np.log(np.maximum(curr_probs, 1e-8))
                entropy_grad = -curr_probs * (log_p + 1.0)

                self.theta[s] += self.lr_actor * (actor_step + self.entropy_coef * entropy_grad)

        # Clear buffer after optimization
        self.buffer_states.clear()
        self.buffer_actions.clear()
        self.buffer_rewards.clear()
        self.buffer_next_states.clear()
        self.buffer_old_probs.clear()

    def get_action_values(self, state):
        state = tuple(int(x) for x in state)
        val = self.V[state]
        pref = self.theta[state]
        return [float(val + (pref[a] - np.mean(pref))) for a in range(self.num_counters)]
