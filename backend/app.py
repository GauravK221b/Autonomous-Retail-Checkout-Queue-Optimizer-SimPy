from flask import Flask, request, jsonify
from flask_cors import CORS
from simulation_engine import SimulationService
from simpy_engine import SimPyCheckoutSimulator
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def make_serializable(obj):
    try:
        import numpy as np
        if isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        if isinstance(obj, (np.integer, int)):
            return int(obj)
        if isinstance(obj, (np.floating, float)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return [make_serializable(x) for x in obj.tolist()]
    except Exception:
        pass
    if isinstance(obj, (str, bytes)) or obj is None:
        return obj
    if isinstance(obj, dict):
        return {str(k): make_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [make_serializable(i) for i in obj]
    return obj


sim_service = SimulationService()


@app.route("/api/status", methods=["GET"])
def get_status():
    return jsonify({
        "status": "online",
        "trainedEpisodes": sim_service.trained_episodes,
        "numCounters": sim_service.num_counters,
        "maxQueueLen": sim_service.max_queue_len,
        "serviceRates": sim_service.service_rates,
        "epsilon": round(float(sim_service.agent.epsilon), 4),
        "gamma": sim_service.agent.gamma,
        "alpha": sim_service.agent.alpha
    })

@app.route("/api/train", methods=["POST"])
def train():
    data = request.get_json() or {}
    episodes = int(data.get("episodes", 250))
    steps_per_episode = int(data.get("stepsPerEpisode", 25))
    alpha = float(data.get("alpha", 0.1))
    gamma = float(data.get("gamma", 0.95))
    epsilon = float(data.get("epsilon", 0.4))
    epsilon_decay = float(data.get("epsilonDecay", 0.995))
    min_epsilon = float(data.get("minEpsilon", 0.05))
    service_rates = data.get("serviceRates", None)
    if service_rates:
        service_rates = [float(r) for r in service_rates]

    result = sim_service.train_agent(
        episodes=episodes,
        steps_per_episode=steps_per_episode,
        alpha=alpha,
        gamma=gamma,
        epsilon=epsilon,
        epsilon_decay=epsilon_decay,
        min_epsilon=min_epsilon,
        service_rates=service_rates
    )
    return jsonify(make_serializable(result))

@app.route("/api/benchmark", methods=["POST"])
def run_benchmark():
    data = request.get_json() or {}
    steps = int(data.get("steps", 100))
    service_rates = data.get("serviceRates", None)
    if service_rates:
        service_rates = [float(r) for r in service_rates]

    result = sim_service.run_benchmark(steps=steps, service_rates=service_rates)
    return jsonify(make_serializable(result))

@app.route("/api/interactive/reset", methods=["POST"])
def interactive_reset():
    result = sim_service.reset_interactive()
    return jsonify(make_serializable(result))

@app.route("/api/interactive/step", methods=["POST"])
def interactive_step():
    data = request.get_json() or {}
    action = data.get("action", None)
    mode = data.get("mode", "q_learning")

    result = sim_service.step_interactive(action=action, mode=mode)
    return jsonify(make_serializable(result))

@app.route("/api/policy", methods=["GET"])
def get_policy():
    fixed_lane2 = int(request.args.get("fixedLane2", 0))
    result = sim_service.get_policy_matrix(fixed_lane2=fixed_lane2)
    return jsonify(make_serializable(result))

@app.route("/api/q_values", methods=["POST"])
def get_q_values():
    data = request.get_json() or {}
    q0 = int(data.get("q0", 0))
    q1 = int(data.get("q1", 0))
    q2 = int(data.get("q2", 0))

    result = sim_service.get_state_q_values(q0, q1, q2)
    return jsonify(make_serializable(result))

@app.route("/api/simpy/run", methods=["POST"])
def run_simpy():
    data = request.get_json() or {}
    arrival_rate = float(data.get("arrivalRate", 1.0))
    simulation_time = float(data.get("simulationTime", 120.0))
    service_rates = data.get("serviceRates", sim_service.service_rates)
    service_rates = [float(r) for r in service_rates]

    simulator = SimPyCheckoutSimulator(
        service_rates=service_rates,
        arrival_rate=arrival_rate,
        simulation_time=simulation_time
    )

    results = simulator.run_comparison(
        q_learning_agent=sim_service.agent,
        max_queue_len=sim_service.max_queue_len
    )
    return jsonify(make_serializable(results))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[OptiQueue AI] Starting Retail Checkout Queue Optimizer API on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)

