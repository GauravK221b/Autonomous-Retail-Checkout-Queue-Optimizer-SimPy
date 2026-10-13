import simpy
import random
import numpy as np

POLICY_METADATA = {
    "random": {
        "label": "Baseline (Random Routing)",
        "tag": "Zero Intelligence",
        "color": "#94a3b8"
    },
    "shortest_queue": {
        "label": "Heuristic (Shortest Queue)",
        "tag": "Greedy Heuristic",
        "color": "#3b82f6"
    },
    "q_learning": {
        "label": "Q-Learning (Off-Policy TD)",
        "tag": "1-Step TD Control",
        "color": "#10b981"
    },
    "sarsa": {
        "label": "SARSA (On-Policy TD)",
        "tag": "Safe On-Policy TD",
        "color": "#06b6d4"
    },
    "bandit": {
        "label": "Multi-Armed Bandit (UCB1)",
        "tag": "Adaptive Arms",
        "color": "#f59e0b"
    },
    "reinforce": {
        "label": "REINFORCE (w/ Baseline)",
        "tag": "Policy Gradient",
        "color": "#ec4899"
    },
    "a2c": {
        "label": "A2C (Actor-Critic)",
        "tag": "Advantage Actor-Critic",
        "color": "#8b5cf6"
    },
    "ppo": {
        "label": "PPO (Proximal Policy Opt)",
        "tag": "Clipped Surrogate",
        "color": "#6366f1"
    },
    "dqn": {
        "label": "DQN (Deep Q-Network)",
        "tag": "Experience Replay",
        "color": "#14b8a6"
    },
    "double_dqn": {
        "label": "Double DQN",
        "tag": "Decoupled Q-Target",
        "color": "#0ea5e9"
    },
    "ddpg": {
        "label": "DDPG (Deep Deterministic PG)",
        "tag": "Continuous Actor-Critic",
        "color": "#a855f7"
    }
}


class SimPyCheckoutSimulator:
    def __init__(self, service_rates=[0.6, 0.4, 0.3], arrival_rate=1.0, simulation_time=120.0, seed=42):
        self.service_rates = service_rates
        self.arrival_rate = arrival_rate
        self.simulation_time = simulation_time
        self.seed = seed
        self.num_lanes = len(service_rates)

    def run_comparison(self, agents_dict=None, q_learning_agent=None, max_queue_len=5):
        """
        Runs multi-policy discrete-event simulation comparison.
        Supports both agents_dict (all models) and legacy q_learning_agent parameter.
        """
        # Resolve agents
        all_agents = {}
        if isinstance(agents_dict, dict):
            all_agents.update(agents_dict)
        elif q_learning_agent is not None:
            all_agents["q_learning"] = q_learning_agent

        # Base policies
        policies = ["random", "shortest_queue"]

        # Add available RL models
        for mid in ["q_learning", "sarsa", "bandit", "reinforce", "a2c", "ppo", "dqn", "double_dqn", "ddpg"]:
            if mid in all_agents:
                policies.append(mid)

        results = {}
        for policy in policies:
            results[policy] = self._run_single_policy(policy, all_agents.get(policy), max_queue_len)

        # Baseline random average wait for reduction comparison
        rand_avg_wait = results.get("random", {}).get("avgWaitTime", 1.0)
        rand_avg_wait = max(rand_avg_wait, 0.001)

        # Build comparison summary
        summary = []
        for policy in policies:
            res = results[policy]
            meta = POLICY_METADATA.get(policy, {
                "label": policy.title(),
                "tag": "Policy",
                "color": "#64748b"
            })
            avg_wait = res["avgWaitTime"]
            reduction = ((rand_avg_wait - avg_wait) / rand_avg_wait) * 100

            summary.append({
                "policy": policy,
                "label": meta["label"],
                "tag": meta["tag"],
                "color": meta["color"],
                "customersServed": res["totalServed"],
                "totalCustomers": res["totalCustomers"],
                "avgWaitTime": round(avg_wait, 2),
                "maxWaitTime": round(res["maxWaitTime"], 2),
                "avgTotalQueue": round(res["avgTotalQueue"], 2),
                "waitReductionPct": round(reduction, 2),
                "utilization": [round(u * 100, 1) for u in res["laneUtilization"]]
            })

        # Sort summary by lowest average wait time
        summary.sort(key=lambda x: x["avgWaitTime"])

        best_policy = summary[0]["label"] if summary else "N/A"

        return {
            "simulationTime": self.simulation_time,
            "arrivalRate": self.arrival_rate,
            "serviceRates": self.service_rates,
            "summary": summary,
            "bestPolicy": best_policy,
            "details": results
        }

    def _run_single_policy(self, policy_name, agent, max_queue_len):
        random.seed(self.seed)
        np.random.seed(self.seed)
        env = simpy.Environment()

        # Cashier resources (1 cashier per counter)
        counters = [simpy.Resource(env, capacity=1) for _ in range(self.num_lanes)]
        queue_lengths = [0] * self.num_lanes
        busy_times = [0.0] * self.num_lanes
        wait_times = []

        total_customers = 0
        total_served = 0

        # Sampled state history
        sampled_history = []

        def sample_process():
            while True:
                sampled_history.append({
                    "time": round(float(env.now), 1),
                    "lanes": list(queue_lengths),
                    "totalQueue": sum(queue_lengths)
                })
                yield env.timeout(3.0)  # Sample every 3 time units

        env.process(sample_process())

        def customer_generator():
            nonlocal total_customers
            while True:
                # Inter-arrival time: exponential with mean 1 / arrival_rate
                inter_arrival = random.expovariate(self.arrival_rate)
                yield env.timeout(inter_arrival)
                total_customers += 1
                cust_id = total_customers

                # Current state tuple
                current_state = tuple(min(max_queue_len, q) for q in queue_lengths)

                # Action routing decision
                if policy_name == "random":
                    chosen_lane = random.randint(0, self.num_lanes - 1)
                elif policy_name == "shortest_queue":
                    chosen_lane = int(np.argmin(queue_lengths))
                elif agent is not None and hasattr(agent, "choose_action"):
                    chosen_lane = int(agent.choose_action(current_state, explore=False))
                else:
                    chosen_lane = int(np.argmin(queue_lengths))

                env.process(customer_service(cust_id, chosen_lane))

        def customer_service(cid, lane_idx):
            nonlocal total_served
            arrival_time = env.now
            queue_lengths[lane_idx] += 1

            counter = counters[lane_idx]
            with counter.request() as req:
                yield req
                # Service starts
                service_start_time = env.now
                wait_time = service_start_time - arrival_time
                wait_times.append(wait_time)

                # Stochastic service duration (exponential based on lane service rate)
                service_duration = random.expovariate(self.service_rates[lane_idx])
                yield env.timeout(service_duration)

                busy_times[lane_idx] += service_duration
                queue_lengths[lane_idx] -= 1
                total_served += 1

        env.process(customer_generator())
        env.run(until=self.simulation_time)

        avg_wait = float(np.mean(wait_times)) if wait_times else 0.0
        max_wait = float(np.max(wait_times)) if wait_times else 0.0
        avg_total_q = float(np.mean([s["totalQueue"] for s in sampled_history])) if sampled_history else 0.0
        utilization = [min(1.0, busy / self.simulation_time) for busy in busy_times]

        return {
            "policy": policy_name,
            "totalCustomers": total_customers,
            "totalServed": total_served,
            "avgWaitTime": avg_wait,
            "maxWaitTime": max_wait,
            "avgTotalQueue": avg_total_q,
            "laneUtilization": utilization,
            "queueHistory": sampled_history[:40]
        }


if __name__ == "__main__":
    import os
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from simulation_engine import SimulationService

    print("=" * 80)
    print("  OptiQueue AI - Multi-Model SimPy Discrete-Event Simulation Arena")
    print("=" * 80)

    print("\n[1/2] Training RL Agents (Q-Learning, SARSA, Bandit, REINFORCE, A2C, PPO)...")
    service = SimulationService()
    print("      All models trained successfully.")

    print("\n[2/2] Running SimPy Discrete-Event Simulation (120s runtime)...")
    simulator = SimPyCheckoutSimulator(service_rates=[0.6, 0.4, 0.3], arrival_rate=1.0, simulation_time=120.0)
    results = simulator.run_comparison(agents_dict=service.models)

    print("\n" + "=" * 80)
    print(f"{'Routing Strategy':<30} | {'Avg Wait':<9} | {'Max Wait':<9} | {'Reduction':<10} | {'Served':<6}")
    print("-" * 80)
    for row in results["summary"]:
        red_str = f"{row['waitReductionPct']:+.1f}%"
        print(f"{row['label']:<30} | {row['avgWaitTime']:<9.2f} | {row['maxWaitTime']:<9.2f} | {red_str:<10} | {row['customersServed']:<6}")
    print("=" * 80)
    print(f"\n>> Top Performer: {results['bestPolicy']}\n")
