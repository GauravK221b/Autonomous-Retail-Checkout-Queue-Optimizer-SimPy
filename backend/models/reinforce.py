import numpy as np
from .base import BaseQueueAgent

class ReinforceAgent(BaseQueueAgent):
    """
    REINFORCE with State-Value Baseline (Monte Carlo Policy Gradient).
    Policy: Softmax over preferences H(s, a):
       pi(a|s) = exp(H(s, a)) / sum_b exp(H(s, b))
    Baseline: Learned state value function V(s).
    Update per step t in episode:
       delta_t = G_t - V(S_t)
       V(S_t) <- V(S_t) + alpha_v * delta_t
       H(S_t, a) <- H(S_t, a) + alpha_pi * (gamma^t) * delta_t * (1_{a=A_t} - pi(a|S_t))
    """
    def __init__(self, num_counters=3, max_queue_len=5, gamma=0.95,
                 alpha_pi=0.02, alpha_v=0.05):
        super().__init__("REINFORCE (w/ Baseline)", "policy_gradient", num_counters, max_queue_len)
        self.gamma = gamma
        self.alpha_pi = alpha_pi
        self.alpha_v = alpha_v

        # Policy preferences H(s, a): (6, 6, 6, 3)
        self.H = np.zeros(self.state_shape + (self.num_counters,), dtype=np.float64)
        # Baseline V(s): (6, 6, 6)
        self.V = np.zeros(self.state_shape, dtype=np.float64)

        # Episodic buffer to store trajectory
        self.episode_states = []
        self.episode_actions = []
        self.episode_rewards = []

    def get_action_probabilities(self, state):
        state = tuple(int(x) for x in state)
        pref = self.H[state]
        # Numerical stability softmax
        shift_pref = pref - np.max(pref)
        exp_pref = np.exp(shift_pref)
        probs = exp_pref / np.sum(exp_pref)
        return probs.tolist()

    def choose_action(self, state, explore=True):
        probs = self.get_action_probabilities(state)
        if explore:
            return int(np.random.choice(self.num_counters, p=probs))
        return int(np.argmax(probs))

    def store_transition(self, state, action, reward):
        self.episode_states.append(tuple(int(x) for x in state))
        self.episode_actions.append(int(action))
        self.episode_rewards.append(float(reward))

    def update_episode(self):
        """Perform Monte Carlo policy gradient update at the end of an episode."""
        T = len(self.episode_rewards)
        if T == 0:
            return

        # Compute discounted returns G_t
        returns = np.zeros(T, dtype=np.float64)
        G = 0.0
        for t in reversed(range(T)):
            G = self.episode_rewards[t] + self.gamma * G
            returns[t] = G

        # Update baseline and policy preferences
        for t in range(T):
            s = self.episode_states[t]
            a = self.episode_actions[t]
            G_t = returns[t]

            # Advantage with baseline
            delta = G_t - self.V[s]

            # Update baseline V(s)
            self.V[s] += self.alpha_v * delta

            # Policy probabilities pi(s)
            probs = np.array(self.get_action_probabilities(s), dtype=np.float64)

            # Gradient of log pi: grad = 1_{a=A_t} - pi(a|s)
            grad = -probs
            grad[a] += 1.0

            # Update preferences H(s, a)
            discount = self.gamma ** t
            self.H[s] += self.alpha_pi * discount * delta * grad

        # Clear buffer
        self.episode_states.clear()
        self.episode_actions.clear()
        self.episode_rewards.clear()

    def update(self, state, action, reward, next_state=None):
        # Accumulates in episode buffer
        self.store_transition(state, action, reward)

    def get_action_values(self, state):
        state = tuple(int(x) for x in state)
        # Preferences H(s, a) directly indicate action desirability
        return [float(v) for v in self.H[state]]
