import numpy as np

class BaseQueueAgent:
    """
    Abstract Base Class for Retail Checkout Queue RL Agents.
    State: tuple (q0, q1, q2) where qi in {0, ..., max_queue_len}
    Actions: {0, 1, 2} (Counter 0, 1, 2)
    """
    def __init__(self, name, model_type, num_counters=3, max_queue_len=5):
        self.name = name
        self.model_type = model_type  # 'value_based', 'bandit', 'policy_gradient', 'actor_critic'
        self.num_counters = num_counters
        self.max_queue_len = max_queue_len
        self.state_shape = tuple([max_queue_len + 1] * num_counters)

    def state_to_idx(self, state):
        # Flatten (q0, q1, q2) to single integer in [0, 215]
        q0, q1, q2 = [max(0, min(q, self.max_queue_len)) for q in state]
        dim = self.max_queue_len + 1
        return q0 * (dim * dim) + q1 * dim + q2

    def state_features(self, state):
        # Normalized continuous features for linear/neural approximations
        q = np.array([max(0, min(x, self.max_queue_len)) for x in state], dtype=np.float32)
        norm_q = q / float(self.max_queue_len)
        var_q = np.var(norm_q)
        total_q = np.sum(norm_q)
        # Vector of size 5: [q0/5, q1/5, q2/5, sum/15, var]
        return np.array([norm_q[0], norm_q[1], norm_q[2], total_q / 3.0, var_q], dtype=np.float32)

    def choose_action(self, state, explore=True):
        raise NotImplementedError

    def update(self, *args, **kwargs):
        raise NotImplementedError

    def get_action_values(self, state):
        """Returns 3 float values representing lane scores, Q-values, or action preferences."""
        raise NotImplementedError

    def get_action_probabilities(self, state):
        """Returns action distribution [p0, p1, p2]."""
        vals = np.array(self.get_action_values(state), dtype=np.float64)
        exp_v = np.exp(vals - np.max(vals))
        return (exp_v / np.sum(exp_v)).tolist()

    def get_policy_matrix(self, fixed_lane2=0):
        """Returns 6x6 matrix of optimal action choices for fixed Lane 2 queue."""
        fixed_lane2 = max(0, min(fixed_lane2, self.max_queue_len))
        matrix = []
        for q0 in range(self.max_queue_len + 1):
            row = []
            for q1 in range(self.max_queue_len + 1):
                state = (q0, q1, fixed_lane2)
                action = self.choose_action(state, explore=False)
                row.append(int(action))
            matrix.append(row)
        return matrix

    def get_value_matrix(self, fixed_lane2=0):
        """Returns 6x6 matrix of max value / utility for fixed Lane 2 queue."""
        fixed_lane2 = max(0, min(fixed_lane2, self.max_queue_len))
        matrix = []
        for q0 in range(self.max_queue_len + 1):
            row = []
            for q1 in range(self.max_queue_len + 1):
                state = (q0, q1, fixed_lane2)
                vals = self.get_action_values(state)
                row.append(round(float(np.max(vals)), 2))
            matrix.append(row)
        return matrix
