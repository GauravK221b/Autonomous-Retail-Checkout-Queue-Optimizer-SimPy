import simpy
import random
import numpy as np

class SimPyCheckoutSimulator:
    def __init__(self, service_rates=[0.6, 0.4, 0.3], arrival_rate=1.0, simulation_time=120.0, seed=42):
        self.service_rates = service_rates
        self.arrival_rate = arrival_rate
        self.simulation_time = simulation_time
        self.seed = seed
        self.num_lanes = len(service_rates)

    def run_comparison(self, q_learning_agent=None, max_queue_len=5):
        policies = ["random", "shortest_queue"]
        if q_learning_agent is not None:
            policies.append("q_learning")

        results = {}
        for policy in policies:
            results[policy] = self._run_single_policy(policy, q_learning_agent, max_queue_len)

        # Build comparison summary
        summary = []
        for policy in policies:
            res = results[policy]
            summary.append({
                "policy": policy,
                "label": "Baseline (Random Routing)" if policy == "random" else (
                    "Heuristic (Shortest Queue)" if policy == "shortest_queue" else "Q-Learning RL Optimizer"
                ),
                "customersServed": res["totalServed"],
                "avgWaitTime": round(res["avgWaitTime"], 2),
                "maxWaitTime": round(res["maxWaitTime"], 2),
                "avgTotalQueue": round(res["avgTotalQueue"], 2),
                "utilization": [round(u * 100, 1) for u in res["laneUtilization"]]
            })

        # Calculate improvement vs random
        if "random" in results and "q_learning" in results:
            rand_avg_wait = results["random"]["avgWaitTime"]
            opt_avg_wait = results["q_learning"]["avgWaitTime"]
            wait_reduction = ((rand_avg_wait - opt_avg_wait) / rand_avg_wait * 100) if rand_avg_wait > 0 else 0.0
        else:
            wait_reduction = 0.0

        return {
            "simulationTime": self.simulation_time,
            "arrivalRate": self.arrival_rate,
            "serviceRates": self.service_rates,
            "summary": summary,
            "waitReductionPct": round(wait_reduction, 2),
            "details": results
        }

    def _run_single_policy(self, policy_name, q_learning_agent, max_queue_len):
        random.seed(self.seed)
        np.random.seed(self.seed)
        env = simpy.Environment()

        # Cashier resources
        counters = [simpy.Resource(env, capacity=1) for _ in range(self.num_lanes)]
        queue_lengths = [0] * self.num_lanes
        busy_times = [0.0] * self.num_lanes

        wait_times = []
        sampled_history = []
        total_customers = 0
        total_served = 0

        # Sampler process to record queue lengths periodically
        def sampler():
            sample_interval = 2.0
            while True:
                total_q = sum(queue_lengths)
                sampled_history.append({
                    "time": round(env.now, 1),
                    "totalQueue": total_q,
                    "lane0": queue_lengths[0],
                    "lane1": queue_lengths[1],
                    "lane2": queue_lengths[2]
                })
                yield env.timeout(sample_interval)

        env.process(sampler())

        # Customer generator
        def customer_generator():
            nonlocal total_customers, total_served
            cust_id = 0
            while True:
                # Inter-arrival exponential time
                inter_arrival = random.expovariate(self.arrival_rate)
                yield env.timeout(inter_arrival)
                cust_id += 1
                total_customers += 1

                # Select lane based on policy
                current_state = tuple(min(q, max_queue_len) for q in queue_lengths)
                if policy_name == "random":
                    chosen_lane = random.randint(0, self.num_lanes - 1)
                elif policy_name == "shortest_queue":
                    chosen_lane = int(np.argmin(queue_lengths))
                elif policy_name == "q_learning" and q_learning_agent is not None:
                    chosen_lane = int(np.argmax(q_learning_agent.Q[current_state]))
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
            "queueHistory": sampled_history[:40]  # First 40 sample points for chart
        }
