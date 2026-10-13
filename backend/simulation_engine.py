import os
import sys
import numpy as np

# Ensure local models package can be resolved
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import (
    AVAILABLE_MODELS,
    QLearningAgent,
    SarsaAgent,
    ContextualBanditAgent,
    ReinforceAgent,
    A2CAgent,
    PPOAgent,
    DQNAgent,
    DoubleDQNAgent,
    DDPGAgent
)

class RetailQueueEnv:
    """
    3-Counter Asymmetric Checkout Queue Environment.
    State: (q0, q1, q2) with qi in {0, ..., max_queue_len}
    Action: {0, 1, 2} customer routed to counter i.
    Reward: -(sum(q) + 0.5 * Var(q))
    """
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


# Backward compatibility alias
QLearningQueueOptimizer = QLearningAgent


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

        # Multi-model dictionary
        self.models = {}
        self.active_model_id = "q_learning"
        self.trained_episodes = 250
        self.training_histories = {}
        self.initial_policy_snapshots = {}

        # Initialize all model instances
        self._init_all_models()

        # Pre-train all models on startup so comparison & UI is immediately live
        self.train_all_models(episodes=250, steps_per_episode=25)

        # Interactive state
        self.interactive_env = RetailQueueEnv(
            num_counters=self.num_counters,
            max_queue_len=self.max_queue_len,
            service_rates=self.service_rates
        )
        self.interactive_step_count = 0
        self.interactive_history = []

    def _init_all_models(self, alpha=0.1, gamma=0.95, epsilon=0.4, epsilon_decay=0.995, min_epsilon=0.05):
        self.models = {
            "q_learning": QLearningAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                gamma=gamma,
                alpha=alpha,
                epsilon=epsilon,
                epsilon_decay=epsilon_decay,
                min_epsilon=min_epsilon
            ),
            "sarsa": SarsaAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                gamma=gamma,
                alpha=alpha,
                epsilon=epsilon,
                epsilon_decay=epsilon_decay,
                min_epsilon=min_epsilon
            ),
            "bandit": ContextualBanditAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                c_param=1.2,
                epsilon=0.15
            ),
            "reinforce": ReinforceAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                gamma=gamma,
                alpha_pi=0.02,
                alpha_v=0.05
            ),
            "a2c": A2CAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                gamma=gamma,
                alpha_actor=0.03,
                alpha_critic=0.08,
                entropy_coef=0.01
            ),
            "ppo": PPOAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                gamma=gamma,
                gae_lambda=0.95,
                clip_eps=0.2,
                lr_actor=0.03,
                lr_critic=0.06,
                epochs=4,
                entropy_coef=0.01
            ),
            "dqn": DQNAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                gamma=gamma,
                lr=0.005,
                epsilon=epsilon,
                epsilon_decay=epsilon_decay,
                min_epsilon=min_epsilon
            ),
            "double_dqn": DoubleDQNAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                gamma=gamma,
                lr=0.005,
                epsilon=epsilon,
                epsilon_decay=epsilon_decay,
                min_epsilon=min_epsilon
            ),
            "ddpg": DDPGAgent(
                num_counters=self.num_counters,
                max_queue_len=self.max_queue_len,
                gamma=gamma,
                lr_actor=0.003,
                lr_critic=0.006,
                tau=0.02,
                noise_std=0.2
            )
        }
        for mid, agent in self.models.items():
            self.initial_policy_snapshots[mid] = agent.get_policy_matrix(fixed_lane2=0)

    @property
    def agent(self):
        """Active agent accessor for backward compatibility."""
        return self.models.get(self.active_model_id, self.models["q_learning"])

    def set_active_model(self, model_id):
        if model_id in self.models:
            self.active_model_id = model_id
            return True
        return False

    def train_model(self, model_id, episodes=250, steps_per_episode=25,
                    alpha=0.1, gamma=0.95, epsilon=0.4, epsilon_decay=0.995, min_epsilon=0.05,
                    service_rates=None):
        if service_rates is not None:
            self.service_rates = service_rates

        np.random.seed(self.seed)
        env = RetailQueueEnv(
            num_counters=self.num_counters,
            max_queue_len=self.max_queue_len,
            service_rates=self.service_rates
        )

        # Re-instantiate specific agent
        if model_id == "q_learning":
            agent = QLearningAgent(self.num_counters, self.max_queue_len, gamma, alpha, epsilon, epsilon_decay, min_epsilon)
        elif model_id == "sarsa":
            agent = SarsaAgent(self.num_counters, self.max_queue_len, gamma, alpha, epsilon, epsilon_decay, min_epsilon)
        elif model_id == "bandit":
            agent = ContextualBanditAgent(self.num_counters, self.max_queue_len, c_param=1.2, epsilon=0.15)
        elif model_id == "reinforce":
            agent = ReinforceAgent(self.num_counters, self.max_queue_len, gamma, alpha_pi=alpha * 0.2, alpha_v=alpha * 0.5)
        elif model_id == "a2c":
            agent = A2CAgent(self.num_counters, self.max_queue_len, gamma, alpha_actor=alpha * 0.3, alpha_critic=alpha * 0.8)
        elif model_id == "ppo":
            agent = PPOAgent(self.num_counters, self.max_queue_len, gamma, gae_lambda=0.95, clip_eps=0.2, lr_actor=alpha * 0.3, lr_critic=alpha * 0.6)
        elif model_id == "dqn":
            agent = DQNAgent(self.num_counters, self.max_queue_len, gamma, lr=0.005, epsilon=epsilon, epsilon_decay=epsilon_decay, min_epsilon=min_epsilon)
        elif model_id == "double_dqn":
            agent = DoubleDQNAgent(self.num_counters, self.max_queue_len, gamma, lr=0.005, epsilon=epsilon, epsilon_decay=epsilon_decay, min_epsilon=min_epsilon)
        elif model_id == "ddpg":
            agent = DDPGAgent(self.num_counters, self.max_queue_len, gamma, lr_actor=0.003, lr_critic=0.006, tau=0.02, noise_std=0.2)
        else:
            agent = self.models.get(model_id, self.models["q_learning"])

        self.initial_policy_snapshots[model_id] = agent.get_policy_matrix(fixed_lane2=0)

        episode_rewards = []
        param_telemetry = []

        for ep in range(1, episodes + 1):
            state = env.reset()
            total_ep_reward = 0.0

            if model_id == "sarsa":
                action = agent.choose_action(state, explore=True)
                for _ in range(steps_per_episode):
                    next_state, reward = env.step(action)
                    next_action = agent.choose_action(next_state, explore=True)
                    agent.update(state, action, reward, next_state, next_action)
                    total_ep_reward += reward
                    state = next_state
                    action = next_action
                agent.decay_epsilon()
                param_telemetry.append(float(agent.epsilon))

            elif model_id in ["q_learning", "dqn", "double_dqn"]:
                for _ in range(steps_per_episode):
                    action = agent.choose_action(state, explore=True)
                    next_state, reward = env.step(action)
                    agent.update(state, action, reward, next_state)
                    total_ep_reward += reward
                    state = next_state
                agent.decay_epsilon()
                param_telemetry.append(float(agent.epsilon))

            elif model_id == "ddpg":
                for _ in range(steps_per_episode):
                    action = agent.choose_action(state, explore=True)
                    next_state, reward = env.step(action)
                    agent.update(state, action, reward, next_state)
                    total_ep_reward += reward
                    state = next_state
                agent.decay_epsilon()
                param_telemetry.append(float(agent.noise_std))

            elif model_id == "reinforce":
                for _ in range(steps_per_episode):
                    action = agent.choose_action(state, explore=True)
                    next_state, reward = env.step(action)
                    agent.store_transition(state, action, reward)
                    total_ep_reward += reward
                    state = next_state
                agent.update_episode()
                param_telemetry.append(0.0)

            elif model_id == "ppo":
                for _ in range(steps_per_episode):
                    action = agent.choose_action(state, explore=True)
                    next_state, reward = env.step(action)
                    agent.store_step(state, action, reward, next_state)
                    total_ep_reward += reward
                    state = next_state
                agent.optimize_batch()
                param_telemetry.append(0.0)

            elif model_id == "a2c":
                for _ in range(steps_per_episode):
                    action = agent.choose_action(state, explore=True)
                    next_state, reward = env.step(action)
                    agent.update(state, action, reward, next_state)
                    total_ep_reward += reward
                    state = next_state
                param_telemetry.append(0.0)

            elif model_id == "bandit":
                for _ in range(steps_per_episode):
                    action = agent.choose_action(state, explore=True)
                    next_state, reward = env.step(action)
                    agent.update(state, action, reward, next_state)
                    total_ep_reward += reward
                    state = next_state
                param_telemetry.append(float(agent.epsilon))

            episode_rewards.append(float(total_ep_reward))

        self.models[model_id] = agent

        # Moving average (window 10)
        window = 10
        moving_avg = []
        if len(episode_rewards) >= window:
            cumsum = np.cumsum(np.insert(episode_rewards, 0, 0))
            moving_avg_vals = (cumsum[window:] - cumsum[:-window]) / window
            moving_avg = [None] * (window - 1) + [float(v) for v in moving_avg_vals]
        else:
            moving_avg = episode_rewards

        history = [
            {
                "episode": i + 1,
                "reward": round(episode_rewards[i], 2),
                "movingAvg": round(moving_avg[i], 2) if moving_avg[i] is not None else round(episode_rewards[i], 2),
                "telemetry": round(param_telemetry[i], 4)
            }
            for i in range(len(episode_rewards))
        ]
        self.training_histories[model_id] = history
        return history

    def train_all_models(self, episodes=250, steps_per_episode=25, **kwargs):
        for mid in self.models.keys():
            self.train_model(mid, episodes=episodes, steps_per_episode=steps_per_episode, **kwargs)
        self.trained_episodes = episodes

    def train_agent(self, episodes=250, steps_per_episode=25, alpha=0.1, gamma=0.95,
                    epsilon=0.4, epsilon_decay=0.995, min_epsilon=0.05, service_rates=None,
                    model_type=None):
        if model_type and model_type in self.models:
            history = self.train_model(
                model_type, episodes, steps_per_episode, alpha, gamma, epsilon, epsilon_decay, min_epsilon, service_rates
            )
            self.active_model_id = model_type
        else:
            self.train_all_models(
                episodes, steps_per_episode, alpha=alpha, gamma=gamma,
                epsilon=epsilon, epsilon_decay=epsilon_decay, min_epsilon=min_epsilon,
                service_rates=service_rates
            )
            history = self.training_histories.get(self.active_model_id, [])

        return {
            "episodes": episodes,
            "activeModel": self.active_model_id,
            "finalReward": float(history[-1]["reward"]) if history else 0.0,
            "history": history
        }

    def run_benchmark(self, steps=100, service_rates=None, selected_model_id=None):
        if service_rates is not None:
            self.service_rates = service_rates

        def evaluate(env, policy_fn, run_seed=42):
            np.random.seed(run_seed)
            env.reset()
            total_wait_time = 0
            history = []
            variances = []
            routed_actions = []

            for step in range(steps):
                state = tuple(int(x) for x in env.queues)
                action = policy_fn(env, state)
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

        # 1. Baseline: Random
        rand_wait, rand_hist, rand_vars, rand_actions = evaluate(
            bench_env, lambda e, s: int(np.random.choice(e.num_counters))
        )

        # 2. Heuristic: Shortest Queue
        heur_wait, heur_hist, heur_vars, heur_actions = evaluate(
            bench_env, lambda e, s: int(np.argmin(s))
        )

        # 3. All RL Models
        models_results = {}
        for mid, agent in self.models.items():
            wait, hist, vars_, acts = evaluate(
                bench_env, lambda e, s, ag=agent: ag.choose_action(s, explore=False)
            )
            pct_red = ((rand_wait - wait) / rand_wait * 100) if rand_wait > 0 else 0.0
            models_results[mid] = {
                "id": mid,
                "name": agent.name,
                "family": agent.model_type,
                "totalWait": wait,
                "avgWaitPerStep": round(float(wait / steps), 2),
                "avgVariance": round(float(np.mean(vars_)), 3),
                "congestionReductionPct": round(float(pct_red), 2),
                "history": hist,
                "actions": acts
            }

        active_id = selected_model_id or self.active_model_id
        active_res = models_results.get(active_id, models_results["q_learning"])
        opt_wait = active_res["totalWait"]
        opt_hist = active_res["history"]
        opt_actions = active_res["actions"]
        opt_vars = [np.var(h) for h in opt_hist]

        step_details = []
        for i in range(steps):
            rand_sum = int(np.sum(rand_hist[i]))
            opt_sum = int(np.sum(opt_hist[i]))
            heur_sum = int(np.sum(heur_hist[i]))
            step_record = {
                "step": int(i + 1),
                "randomTotal": rand_sum,
                "optTotal": opt_sum,
                "heuristicTotal": heur_sum,
                "randomLanes": [int(x) for x in rand_hist[i]],
                "optLanes": [int(x) for x in opt_hist[i]],
                "heuristicLanes": [int(x) for x in heur_hist[i]],
                "randomAction": int(rand_actions[i]),
                "optAction": int(opt_actions[i]),
                "heuristicAction": int(heur_actions[i]),
                "waitDifference": int(rand_sum - opt_sum)
            }
            for mid, mres in models_results.items():
                step_record[f"{mid}Total"] = int(np.sum(mres["history"][i]))
            step_details.append(step_record)

        leaderboard = [
            {
                "id": "random",
                "name": "Random Baseline",
                "tag": "Zero Intelligence",
                "totalWait": rand_wait,
                "avgWait": round(float(rand_wait / steps), 2),
                "variance": round(float(np.mean(rand_vars)), 3),
                "improvement": 0.0
            },
            {
                "id": "shortest_queue",
                "name": "Shortest Queue",
                "tag": "Greedy Heuristic",
                "totalWait": heur_wait,
                "avgWait": round(float(heur_wait / steps), 2),
                "variance": round(float(np.mean(heur_vars)), 3),
                "improvement": round(((rand_wait - heur_wait) / rand_wait * 100), 2)
            }
        ]
        for mid, mres in models_results.items():
            leaderboard.append({
                "id": mid,
                "name": mres["name"],
                "tag": AVAILABLE_MODELS.get(mid, {}).get("tag", "RL Agent"),
                "totalWait": mres["totalWait"],
                "avgWait": mres["avgWaitPerStep"],
                "variance": mres["avgVariance"],
                "improvement": mres["congestionReductionPct"]
            })

        leaderboard.sort(key=lambda x: x["totalWait"])

        return {
            "steps": int(steps),
            "activeModelId": active_id,
            "activeModelName": active_res["name"],
            "randomTotalWait": int(rand_wait),
            "heuristicTotalWait": int(heur_wait),
            "optimizedTotalWait": int(opt_wait),
            "difference": int(rand_wait - opt_wait),
            "congestionReductionPct": active_res["congestionReductionPct"],
            "randomAvgWaitPerStep": round(float(rand_wait / steps), 2),
            "optAvgWaitPerStep": round(float(opt_wait / steps), 2),
            "heuristicAvgWaitPerStep": round(float(heur_wait / steps), 2),
            "randomAvgVariance": round(float(np.mean(rand_vars)), 3),
            "optAvgVariance": round(float(np.mean(opt_vars)), 3),
            "models": {mid: {k: v for k, v in mres.items() if k not in ["history", "actions"]} for mid, mres in models_results.items()},
            "leaderboard": leaderboard,
            "stepDetails": step_details
        }

    def reset_interactive(self, model_id=None):
        if model_id and model_id in self.models:
            self.active_model_id = model_id
        active_agent = self.agent

        state = self.interactive_env.reset()
        self.interactive_step_count = 0
        self.interactive_history = []
        return {
            "step": 0,
            "state": list(state),
            "activeModel": self.active_model_id,
            "activeModelName": active_agent.name,
            "totalWaiting": int(np.sum(state)),
            "variance": round(float(np.var(state)), 2),
            "qValues": [round(float(q), 3) for q in active_agent.get_action_values(state)],
            "recommendedAction": int(active_agent.choose_action(state, explore=False))
        }

    def step_interactive(self, action=None, mode=None):
        current_state = tuple(self.interactive_env.queues)
        mode = mode or self.active_model_id

        if action is None:
            if mode in self.models:
                chosen_agent = self.models[mode]
                action = int(chosen_agent.choose_action(current_state, explore=False))
            elif mode == "shortest_queue":
                action = int(np.argmin(current_state))
            else:
                action = int(np.random.choice(self.interactive_env.num_counters))
        else:
            action = int(action)

        queues_before = list(self.interactive_env.queues)
        if queues_before[action] < self.interactive_env.max_queue_len:
            queues_before[action] += 1

        next_state, reward = self.interactive_env.step(action)
        self.interactive_step_count += 1

        served_flags = []
        for i in range(self.num_counters):
            served = (queues_before[i] > next_state[i])
            served_flags.append(served)

        active_agent = self.models.get(mode, self.agent)
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
            "activeModel": mode,
            "activeModelName": active_agent.name if hasattr(active_agent, "name") else mode.title(),
            "qValues": [round(float(q), 3) for q in active_agent.get_action_values(next_state)],
            "recommendedAction": int(active_agent.choose_action(next_state, explore=False))
        }

        self.interactive_history.append(step_record)
        return step_record

    def get_policy_matrix(self, model_id=None, fixed_lane2=0):
        mid = model_id or self.active_model_id
        agent = self.models.get(mid, self.models["q_learning"])
        fixed_lane2 = max(0, min(fixed_lane2, self.max_queue_len))

        learned_matrix = agent.get_policy_matrix(fixed_lane2=fixed_lane2)
        value_matrix = agent.get_value_matrix(fixed_lane2=fixed_lane2)
        initial_slice = self.initial_policy_snapshots.get(mid, learned_matrix)

        return {
            "modelId": mid,
            "modelName": agent.name,
            "modelType": agent.model_type,
            "fixedLane2": fixed_lane2,
            "maxQueueLen": self.max_queue_len,
            "learnedPolicy": learned_matrix,
            "initialPolicy": initial_slice,
            "maxQValues": value_matrix
        }

    def get_state_q_values(self, q0, q1, q2, model_id=None):
        mid = model_id or self.active_model_id
        agent = self.models.get(mid, self.models["q_learning"])

        q0 = max(0, min(q0, self.max_queue_len))
        q1 = max(0, min(q1, self.max_queue_len))
        q2 = max(0, min(q2, self.max_queue_len))
        state = (q0, q1, q2)

        raw_vals = agent.get_action_values(state)
        best_action = int(agent.choose_action(state, explore=False))

        return {
            "modelId": mid,
            "modelName": agent.name,
            "state": [q0, q1, q2],
            "qValues": [round(float(v), 4) for v in raw_vals],
            "actionProbabilities": [round(float(p), 4) for p in agent.get_action_probabilities(state)],
            "bestAction": best_action,
            "laneLabels": [
                f"Lane 0 (Fast: μ={self.service_rates[0]})",
                f"Lane 1 (Mid: μ={self.service_rates[1]})",
                f"Lane 2 (Slow: μ={self.service_rates[2]})"
            ]
        }

    def get_models_overview(self):
        overview = []
        for mid, info in AVAILABLE_MODELS.items():
            agent = self.models.get(mid)
            overview.append({
                "id": mid,
                "name": info["name"],
                "family": info["family"],
                "tag": info["tag"],
                "description": info["description"],
                "isActive": (mid == self.active_model_id),
                "isTrained": (mid in self.models),
                "trainingHistoryLength": len(self.training_histories.get(mid, []))
            })
        return overview

    def run_comparative_analysis(self, scenario_name="normal"):
        """
        Executes rigorous academic-grade comparative analysis across all models and heuristic strategies.
        Generates Table IV metrics with mean ± std error, queue over time, staff cost, throughput,
        and stress scenario responses.
        """
        import simpy
        import random

        SCENARIOS = {
            "normal": {
                "id": "normal",
                "label": "Standard Retail Operations",
                "arrivalRate": 1.0,
                "serviceRates": [0.6, 0.4, 0.3],
                "duration": 120.0,
                "description": "Baseline weekday shopping traffic with steady customer flow and normal cashier speeds."
            },
            "rush_hour": {
                "id": "rush_hour",
                "label": "Peak Rush Hour (Surge Arrivals)",
                "arrivalRate": 2.2,
                "serviceRates": [0.6, 0.4, 0.3],
                "duration": 120.0,
                "description": "High-density evening surge (2.2 cust/sec) testing queue overflow and capacity saturation."
            },
            "cashier_fatigue": {
                "id": "cashier_fatigue",
                "label": "Express Counter Slowdown (Staff Fatigue)",
                "arrivalRate": 1.2,
                "serviceRates": [0.35, 0.35, 0.30],
                "duration": 120.0,
                "description": "Express lane service degradation (μ0 drops from 0.60 to 0.35) testing resilience under cashier bottlenecks."
            },
            "flash_surge": {
                "id": "flash_surge",
                "label": "Flash Mob / Bulk Surge",
                "arrivalRate": 2.8,
                "serviceRates": [0.6, 0.4, 0.3],
                "duration": 60.0,
                "description": "Instantaneous massive customer influx concentrated over a brief 60-second window."
            }
        }

        active_scen = SCENARIOS.get(scenario_name, SCENARIOS["normal"])
        service_rates = active_scen["serviceRates"]
        arrival_rate = active_scen["arrivalRate"]
        duration = active_scen["duration"]
        num_lanes = len(service_rates)

        STRATEGIES = [
            {"id": "rule_based", "name": "Rule-Based Manager", "type": "Baseline (Random)", "isProposed": False},
            {"id": "shortest_queue", "name": "Shortest-Queue Manager", "type": "Greedy Heuristic", "isProposed": False},
            {"id": "min_estimated_wait", "name": "Minimum Estimated Wait Manager", "type": "Heuristic (q/μ)", "isProposed": False},
            {"id": "q_learning", "name": "Tabular Q-Learning", "type": "Value-Based TD", "isProposed": False},
            {"id": "sarsa", "name": "SARSA", "type": "On-Policy TD", "isProposed": False},
            {"id": "bandit", "name": "Multi-Armed Bandit (UCB1)", "type": "Adaptive Arms", "isProposed": False},
            {"id": "reinforce", "name": "REINFORCE (w/ Baseline)", "type": "Policy Gradient", "isProposed": False},
            {"id": "a2c", "name": "A2C (Actor-Critic)", "type": "Actor-Critic", "isProposed": False},
            {"id": "ppo", "name": "PPO (Proximal Policy Opt)", "type": "Actor-Critic", "isProposed": False},
            {"id": "dqn", "name": "DQN (Deep Q-Network)", "type": "Deep RL", "isProposed": False},
            {"id": "double_dqn", "name": "Double DQN (Proposed)", "type": "Deep RL", "isProposed": True},
            {"id": "ddpg", "name": "DDPG (Actor-Critic)", "type": "Deep RL", "isProposed": False}
        ]

        SEEDS = [42, 101, 777]

        def simulate_trial(strat_id, seed):
            random.seed(seed)
            np.random.seed(seed)
            env = simpy.Environment()
            counters = [simpy.Resource(env, capacity=1) for _ in range(num_lanes)]
            queue_lengths = [0] * num_lanes
            busy_times = [0.0] * num_lanes
            wait_times = []
            active_counter_samples = []
            reward_samples = []
            timeline = []

            total_customers = 0
            total_served = 0

            def sampler():
                while True:
                    act_count = sum(1 for q in queue_lengths if q > 0)
                    active_counter_samples.append(act_count)
                    tot_q = sum(queue_lengths)
                    v_q = np.var(queue_lengths)
                    r = -(tot_q + 0.5 * v_q)
                    reward_samples.append(r)
                    timeline.append({"time": round(float(env.now), 1), "queue": tot_q})
                    yield env.timeout(3.0)

            env.process(sampler())

            def cust_generator():
                nonlocal total_customers
                while True:
                    yield env.timeout(random.expovariate(arrival_rate))
                    total_customers += 1
                    cid = total_customers
                    curr_state = tuple(min(self.max_queue_len, q) for q in queue_lengths)

                    if strat_id == "rule_based":
                        chosen = random.randint(0, num_lanes - 1)
                    elif strat_id == "shortest_queue":
                        chosen = int(np.argmin(queue_lengths))
                    elif strat_id == "min_estimated_wait":
                        est_waits = [(queue_lengths[i] + 1) / service_rates[i] for i in range(num_lanes)]
                        chosen = int(np.argmin(est_waits))
                    elif strat_id in self.models:
                        chosen = int(self.models[strat_id].choose_action(curr_state, explore=False))
                    else:
                        chosen = int(np.argmin(queue_lengths))

                    env.process(service_coro(cid, chosen))

            def service_coro(cid, lane_idx):
                nonlocal total_served
                arr_t = env.now
                queue_lengths[lane_idx] += 1
                with counters[lane_idx].request() as req:
                    yield req
                    wait_times.append(env.now - arr_t)
                    s_dur = random.expovariate(service_rates[lane_idx])
                    yield env.timeout(s_dur)
                    busy_times[lane_idx] += s_dur
                    queue_lengths[lane_idx] -= 1
                    total_served += 1

            env.process(cust_generator())
            env.run(until=duration)

            avg_wait = float(np.mean(wait_times)) if wait_times else 0.0
            avg_active = float(np.mean(active_counter_samples)) if active_counter_samples else 0.0
            cum_reward = float(np.sum(reward_samples)) if reward_samples else 0.0
            throughput = (total_served / duration) * 60.0  # cust / min
            utilizations = [min(1.0, b / duration) for b in busy_times]
            mean_util = float(np.mean(utilizations))
            # Hourly staff wages: 3 counters * $18.50 base rate * (0.4 idle + 0.6 active duty)
            hourly_staff_cost = 3 * 18.50 * (0.4 + 0.6 * mean_util)
            cost_per_cust = (hourly_staff_cost / (throughput * 60.0)) if throughput > 0 else 0.0

            return {
                "avgWaitSec": avg_wait,
                "avgWaitMin": avg_wait / 60.0,
                "activeCounters": avg_active,
                "cumulativeReward": cum_reward,
                "totalServed": total_served,
                "totalCustomers": total_customers,
                "throughput": throughput,
                "hourlyStaffCost": hourly_staff_cost,
                "costPerCust": cost_per_cust,
                "timeline": timeline
            }

        table_rows = []
        timelines_by_strat = {}

        # First evaluate baseline to calculate improvements
        baseline_waits = []
        for s in SEEDS:
            baseline_waits.append(simulate_trial("rule_based", s)["avgWaitSec"])
        baseline_mean_wait = float(np.mean(baseline_waits)) if baseline_waits else 1.0
        baseline_mean_wait = max(baseline_mean_wait, 1e-4)

        for strat in STRATEGIES:
            sid = strat["id"]
            trial_results = [simulate_trial(sid, seed) for seed in SEEDS]

            waits_sec = [t["avgWaitSec"] for t in trial_results]
            waits_min = [t["avgWaitMin"] for t in trial_results]
            actives = [t["activeCounters"] for t in trial_results]
            rewards = [t["cumulativeReward"] for t in trial_results]
            throughputs = [t["throughput"] for t in trial_results]
            staff_costs = [t["hourlyStaffCost"] for t in trial_results]
            costs_per_cust = [t["costPerCust"] for t in trial_results]
            serveds = [t["totalServed"] for t in trial_results]

            m_wait_min, s_wait_min = float(np.mean(waits_min)), float(np.std(waits_min))
            m_wait_sec, s_wait_sec = float(np.mean(waits_sec)), float(np.std(waits_sec))
            m_active, s_active = float(np.mean(actives)), float(np.std(actives))
            m_reward, s_reward = float(np.mean(rewards)), float(np.std(rewards))
            m_tp = float(np.mean(throughputs))
            m_cost = float(np.mean(staff_costs))
            m_cost_per_cust = float(np.mean(costs_per_cust))
            m_served = int(np.mean(serveds))

            # Reported Wait Improvement vs Baseline
            if sid == "rule_based":
                imprv_str = "Baseline"
                imprv_pct = 0.0
            else:
                pct = ((baseline_mean_wait - m_wait_sec) / baseline_mean_wait) * 100.0
                imprv_pct = round(pct, 1)
                imprv_str = f"+{imprv_pct}%" if imprv_pct > 0 else f"{imprv_pct}%"

            table_rows.append({
                "id": sid,
                "strategy": strat["name"],
                "strategyType": strat["type"],
                "isProposed": strat["isProposed"],
                # Exact formatted columns matching Table IV:
                "avgWaitTimeDisplay": f"{m_wait_min:.2f} ± {s_wait_min:.2f}",
                "activeCountersDisplay": f"{m_active:.2f} ± {s_active:.2f}",
                "cumulativeRewardDisplay": f"{m_reward:.1f} ± {s_reward:.1f}",
                "reportedWaitImprovement": imprv_str,
                "reportedWaitImprovementPct": imprv_pct,
                # Quantitative values for charts:
                "avgWaitTimeMin": round(m_wait_min, 3),
                "avgWaitTimeSec": round(m_wait_sec, 2),
                "waitStdSec": round(s_wait_sec, 2),
                "activeCounters": round(m_active, 2),
                "activeCountersStd": round(s_active, 2),
                "cumulativeReward": round(m_reward, 1),
                "cumulativeRewardStd": round(s_reward, 1),
                "customerThroughput": round(m_tp, 1),
                "totalCustomersServed": m_served,
                "hourlyStaffCost": round(m_cost, 2),
                "staffCostPerCustomer": round(m_cost_per_cust, 3)
            })

            # Store seed-42 timeline for time series charts
            timelines_by_strat[sid] = trial_results[0]["timeline"]

        # Sort table rows by wait improvement
        table_rows.sort(key=lambda x: x["avgWaitTimeSec"])

        # Construct merged queue length over time records
        queue_over_time = []
        if "rule_based" in timelines_by_strat:
            base_t = timelines_by_strat["rule_based"]
            for i in range(len(base_t)):
                point = {"time": base_t[i]["time"]}
                for strat in STRATEGIES:
                    sid = strat["id"]
                    tline = timelines_by_strat.get(sid, [])
                    if i < len(tline):
                        point[sid] = tline[i]["queue"]
                queue_over_time.append(point)

        # Staff cost comparison bar data
        staff_cost_data = [
            {
                "name": r["strategy"].replace(" (Proposed)", "").replace(" Manager", ""),
                "hourlyStaffCost": r["hourlyStaffCost"],
                "staffCostPerCustomer": round(r["staffCostPerCustomer"] * 100, 2),  # cents per customer
                "activeCounters": r["activeCounters"]
            }
            for r in table_rows
        ]

        # Customer throughput comparison bar data
        throughput_data = [
            {
                "name": r["strategy"].replace(" (Proposed)", "").replace(" Manager", ""),
                "throughput": r["customerThroughput"],
                "totalServed": r["totalCustomersServed"],
                "avgWaitSec": r["avgWaitTimeSec"]
            }
            for r in table_rows
        ]

        # Average waiting time bar data with error bounds
        wait_time_data = [
            {
                "name": r["strategy"].replace(" (Proposed)", "").replace(" Manager", ""),
                "avgWaitSec": r["avgWaitTimeSec"],
                "avgWaitMin": r["avgWaitTimeMin"],
                "stdErr": r["waitStdSec"],
                "improvement": r["reportedWaitImprovementPct"]
            }
            for r in table_rows
        ]

        return {
            "scenario": active_scen,
            "allScenarios": list(SCENARIOS.values()),
            "tableIV": table_rows,
            "queueOverTime": queue_over_time,
            "staffCostData": staff_cost_data,
            "throughputData": throughput_data,
            "waitTimeData": wait_time_data
        }

