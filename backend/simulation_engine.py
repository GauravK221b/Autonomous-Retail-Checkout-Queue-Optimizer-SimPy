import os
import sys
import numpy as np

# Define the exact environment and optimizer classes from generate_q_learning_experiment.py
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
            return int(np.random.choice(self.num_counters))
        return int(np.argmax(self.Q[state]))

    def update(self, state, action, reward, next_state):
        best_next_action = np.argmax(self.Q[next_state])
        td_target = reward + self.gamma * self.Q[next_state][best_next_action]
        td_error = td_target - self.Q[state][action]
        self.Q[state][action] += self.alpha * td_error
        self.policy[state] = np.argmax(self.Q[state])

    def decay_epsilon(self):
        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)



class SimulationService:
    def __init__(self):
        self.num_counters = 3
        self.max_queue_len = 5
        self.service_rates = [0.6, 0.4, 0.3]
        self.seed = 42
        np.random.seed(self.seed)

        self.env = RetailQueueEnv(
            num_counters=self.num_counters,
            max_queue_len=self.max_queue_len,
            service_rates=self.service_rates
        )
        self.agent = QLearningQueueOptimizer(
            num_counters=self.num_counters,
            max_queue_len=self.max_queue_len,
            gamma=0.95,
            alpha=0.1,
            epsilon=0.4,
            epsilon_decay=0.995,
            min_epsilon=0.05
        )

        self.trained_episodes = 0
        self.training_history = []
        self.initial_policy_snapshot = np.copy(self.agent.policy)

        # Pre-train default 250 episodes on startup so the system is immediately usable
        self.train_agent(episodes=250, steps_per_episode=25)

        # Interactive state
        self.interactive_env = RetailQueueEnv(
            num_counters=self.num_counters,
            max_queue_len=self.max_queue_len,
            service_rates=self.service_rates
        )
        self.interactive_step_count = 0
        self.interactive_history = []

    def train_agent(self, episodes=250, steps_per_episode=25, alpha=0.1, gamma=0.95, epsilon=0.4, epsilon_decay=0.995, min_epsilon=0.05, service_rates=None):
        if service_rates is not None:
            self.service_rates = service_rates

        np.random.seed(self.seed)
        self.env = RetailQueueEnv(
            num_counters=self.num_counters,
            max_queue_len=self.max_queue_len,
            service_rates=self.service_rates
        )
        self.agent = QLearningQueueOptimizer(
            num_counters=self.num_counters,
            max_queue_len=self.max_queue_len,
            gamma=gamma,
            alpha=alpha,
            epsilon=epsilon,
            epsilon_decay=epsilon_decay,
            min_epsilon=min_epsilon
        )

        self.initial_policy_snapshot = np.copy(self.agent.policy)
        episode_rewards = []
        epsilon_history = []

        for ep in range(1, episodes + 1):
            state = self.env.reset()
            total_ep_reward = 0
            for _ in range(steps_per_episode):
                action = self.agent.choose_action(state, explore=True)
                next_state, reward = self.env.step(action)
                self.agent.update(state, action, reward, next_state)
                total_ep_reward += reward
                state = next_state
            self.agent.decay_epsilon()
            episode_rewards.append(float(total_ep_reward))
            epsilon_history.append(float(self.agent.epsilon))

        self.trained_episodes = episodes

        # Calculate moving average (window 10)
        window = 10
        moving_avg = []
        if len(episode_rewards) >= window:
            cumsum = np.cumsum(np.insert(episode_rewards, 0, 0))
            moving_avg_vals = (cumsum[window:] - cumsum[:-window]) / window
            moving_avg = [None] * (window - 1) + [float(v) for v in moving_avg_vals]
        else:
            moving_avg = episode_rewards

        self.training_history = [
            {
                "episode": i + 1,
                "reward": round(episode_rewards[i], 2),
                "movingAvg": round(moving_avg[i], 2) if moving_avg[i] is not None else round(episode_rewards[i], 2),
                "epsilon": round(epsilon_history[i], 4)
            }
            for i in range(len(episode_rewards))
        ]

        return {
            "episodes": episodes,
            "finalReward": float(episode_rewards[-1]),
            "finalEpsilon": float(self.agent.epsilon),
            "history": self.training_history
        }

    def run_benchmark(self, steps=100, service_rates=None):
        if service_rates is not None:
            self.service_rates = service_rates

        def evaluate(env, agent=None, run_seed=42):
            np.random.seed(run_seed)
            env.reset()
            total_wait_time = 0
            history = []
            variances = []
            routed_actions = []

            for step in range(steps):
                state = tuple(int(x) for x in env.queues)
                if agent is None:
                    action = int(np.random.choice(env.num_counters))
                else:
                    action = int(np.argmax(agent.Q[state]))

                next_state, reward = env.step(action)
                step_wait = int(np.sum(next_state))
                total_wait_time += step_wait
                history.append([int(x) for x in next_state])
                variances.append(float(np.var(next_state)))
                routed_actions.append(int(action))

            return int(total_wait_time), history, variances, routed_actions

        bench_env = RetailQueueEnv(
            num_counters=self.num_counters,
            max_queue_len=self.max_queue_len,
            service_rates=self.service_rates
        )

        rand_wait, rand_hist, rand_vars, rand_actions = evaluate(bench_env, agent=None, run_seed=42)
        opt_wait, opt_hist, opt_vars, opt_actions = evaluate(bench_env, agent=self.agent, run_seed=42)

        pct_reduction = ((rand_wait - opt_wait) / rand_wait) * 100 if rand_wait > 0 else 0.0

        step_details = []
        for i in range(steps):
            rand_sum = int(np.sum(rand_hist[i]))
            opt_sum = int(np.sum(opt_hist[i]))
            step_details.append({
                "step": int(i + 1),
                "randomTotal": rand_sum,
                "optTotal": opt_sum,
                "randomLanes": [int(x) for x in rand_hist[i]],
                "optLanes": [int(x) for x in opt_hist[i]],
                "randomAction": int(rand_actions[i]),
                "optAction": int(opt_actions[i]),
                "waitDifference": int(rand_sum - opt_sum)
            })

        return {
            "steps": int(steps),
            "randomTotalWait": int(rand_wait),
            "optimizedTotalWait": int(opt_wait),
            "difference": int(rand_wait - opt_wait),
            "congestionReductionPct": round(float(pct_reduction), 2),
            "randomAvgWaitPerStep": round(float(rand_wait / steps), 2),
            "optAvgWaitPerStep": round(float(opt_wait / steps), 2),
            "randomAvgVariance": round(float(np.mean(rand_vars)), 3),
            "optAvgVariance": round(float(np.mean(opt_vars)), 3),
            "stepDetails": step_details
        }


    def reset_interactive(self):
        state = self.interactive_env.reset()
        self.interactive_step_count = 0
        self.interactive_history = []
        return {
            "step": 0,
            "state": list(state),
            "totalWaiting": int(np.sum(state)),
            "variance": round(float(np.var(state)), 2),
            "qValues": [round(float(q), 3) for q in self.agent.Q[state]],
            "recommendedAction": int(np.argmax(self.agent.Q[state]))
        }

    def step_interactive(self, action=None, mode="q_learning"):
        current_state = tuple(self.interactive_env.queues)

        if action is None:
            if mode == "q_learning":
                action = int(np.argmax(self.agent.Q[current_state]))
            else:
                action = int(np.random.choice(self.interactive_env.num_counters))
        else:
            action = int(action)

        # Snapshot before service to track served cashiers
        queues_before = list(self.interactive_env.queues)
        if queues_before[action] < self.interactive_env.max_queue_len:
            queues_before[action] += 1

        # Perform step
        next_state, reward = self.interactive_env.step(action)
        self.interactive_step_count += 1

        # Service departure flags
        served_flags = []
        for i in range(self.num_counters):
            # If queue reduced after addition, a service occurred
            served = (queues_before[i] > next_state[i])
            served_flags.append(served)

        step_record = {
            "step": self.interactive_step_count,
            "previousState": list(current_state),
            "action": action,
            "actionLaneName": f"Lane {action}",
            "served": served_flags,
            "nextState": list(next_state),
            "totalWaiting": int(np.sum(next_state)),
            "variance": round(float(np.var(next_state)), 2),
            "reward": round(float(reward), 2),
            "qValues": [round(float(q), 3) for q in self.agent.Q[next_state]],
            "recommendedAction": int(np.argmax(self.agent.Q[next_state]))
        }

        self.interactive_history.append(step_record)
        return step_record

    def get_policy_matrix(self, fixed_lane2=0):
        fixed_lane2 = max(0, min(fixed_lane2, self.max_queue_len))
        policy_slice = self.agent.policy[:, :, fixed_lane2].tolist()
        q_slice = np.max(self.agent.Q[:, :, fixed_lane2, :], axis=-1).tolist()
        initial_slice = self.initial_policy_snapshot[:, :, fixed_lane2].tolist()

        return {
            "fixedLane2": fixed_lane2,
            "maxQueueLen": self.max_queue_len,
            "learnedPolicy": policy_slice,
            "initialPolicy": initial_slice,
            "maxQValues": [[round(val, 2) for val in row] for row in q_slice]
        }

    def get_state_q_values(self, q0, q1, q2):
        q0 = max(0, min(q0, self.max_queue_len))
        q1 = max(0, min(q1, self.max_queue_len))
        q2 = max(0, min(q2, self.max_queue_len))
        state = (q0, q1, q2)

        q_vals = [round(float(v), 4) for v in self.agent.Q[state]]
        best_action = int(np.argmax(self.agent.Q[state]))

        return {
            "state": [q0, q1, q2],
            "qValues": q_vals,
            "bestAction": best_action,
            "laneLabels": [
                f"Lane 0 (Fast: μ={self.service_rates[0]})",
                f"Lane 1 (Mid: μ={self.service_rates[1]})",
                f"Lane 2 (Slow: μ={self.service_rates[2]})"
            ]
        }
