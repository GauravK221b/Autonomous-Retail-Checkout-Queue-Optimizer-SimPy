import numpy as np
from .base import BaseQueueAgent

class A2CAgent(BaseQueueAgent):
    """
    Advantage Actor-Critic (A2C).
    Critic: Parameterized state-value function V(s) estimating expected return.
    Actor: Parameterized policy pi(a|s) using preferences theta(s, a).
    1-Step TD Advantage:
       delta = R + gamma * V(s') - V(s)
    Critic update:
       V(s) <- V(s) + alpha_v * delta
    Actor update (with entropy regularization):
       theta(s, a) <- theta(s, a) + alpha_actor * delta * (1_{a=A} - pi(a|s)) + beta * entropy_grad
    """
    def __init__(self, num_counters=3, max_queue_len=5, gamma=0.95,
                 alpha_actor=0.03, alpha_critic=0.08, entropy_coef=0.01):
        super().__init__("A2C (Advantage Actor-Critic)", "actor_critic", num_counters, max_queue_len)
        self.gamma = gamma
        self.alpha_actor = alpha_actor
        self.alpha_critic = alpha_critic
        self.entropy_coef = entropy_coef

        # Actor parameters theta(s, a): (6, 6, 6, 3)
        self.theta = np.zeros(self.state_shape + (self.num_counters,), dtype=np.float64)
        # Critic state values V(s): (6, 6, 6)
        self.V = np.zeros(self.state_shape, dtype=np.float64)

    def get_action_probabilities(self, state):
        state = tuple(int(x) for x in state)
        pref = self.theta[state]
        shift = pref - np.max(pref)
        exp_vals = np.exp(shift)
        probs = exp_vals / np.sum(exp_vals)
        return probs.tolist()

    def choose_action(self, state, explore=True):
        probs = self.get_action_probabilities(state)
        if explore:
            return int(np.random.choice(self.num_counters, p=probs))
        return int(np.argmax(probs))

    def update(self, state, action, reward, next_state):
        state = tuple(int(x) for x in state)
        next_state = tuple(int(x) for x in next_state)

        # 1-Step TD error (Advantage estimate)
        td_target = reward + self.gamma * self.V[next_state]
        delta = td_target - self.V[state]

        # Update Critic
        self.V[state] += self.alpha_critic * delta

        # Update Actor
        probs = np.array(self.get_action_probabilities(state), dtype=np.float64)
        grad = -probs
        grad[action] += 1.0

        # Entropy gradient: d/d theta [-sum pi * ln pi]
        log_probs = np.log(np.maximum(probs, 1e-8))
        entropy_grad = -probs * (log_probs + 1.0)

        self.theta[state] += self.alpha_actor * (delta * grad + self.entropy_coef * entropy_grad)

    def get_action_values(self, state):
        state = tuple(int(x) for x in state)
        # Combine actor preference with advantage over critic baseline
        probs = np.array(self.get_action_probabilities(state))
        val = self.V[state]
        # Projected Q(s, a) ~ V(s) + advantage_a
        return [float(val + (self.theta[state][a] - np.mean(self.theta[state]))) for a in range(self.num_counters)]
