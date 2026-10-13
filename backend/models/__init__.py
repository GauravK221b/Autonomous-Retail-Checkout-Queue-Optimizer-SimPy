from .base import BaseQueueAgent
from .q_learning import QLearningAgent
from .sarsa import SarsaAgent
from .bandit import ContextualBanditAgent
from .reinforce import ReinforceAgent
from .a2c import A2CAgent
from .ppo import PPOAgent
from .dqn import DQNAgent
from .double_dqn import DoubleDQNAgent
from .ddpg import DDPGAgent

AVAILABLE_MODELS = {
    "q_learning": {
        "id": "q_learning",
        "name": "Q-Learning",
        "family": "Value-Based (Off-Policy TD)",
        "tag": "1-Step TD Control",
        "class": QLearningAgent,
        "description": "Learns the optimal Q*(s, a) directly using off-policy greedy next-state targets."
    },
    "sarsa": {
        "id": "sarsa",
        "name": "SARSA",
        "family": "Value-Based (On-Policy TD)",
        "tag": "Safe On-Policy TD",
        "class": SarsaAgent,
        "description": "On-policy TD control accounting for actual exploratory actions taken, learning conservative policies."
    },
    "bandit": {
        "id": "bandit",
        "name": "Multi-Armed Bandit",
        "family": "Bandit / Adaptive Strategy",
        "tag": "Contextual UCB1",
        "class": ContextualBanditAgent,
        "description": "Adaptive arm selection using Upper Confidence Bound (UCB1) for immediate reward optimization."
    },
    "reinforce": {
        "id": "reinforce",
        "name": "REINFORCE (w/ Baseline)",
        "family": "Policy Gradient (Monte Carlo)",
        "tag": "Softmax Policy Gradient",
        "class": ReinforceAgent,
        "description": "Direct policy optimization via episodic Monte Carlo returns with a learned state-value baseline."
    },
    "a2c": {
        "id": "a2c",
        "name": "A2C (Advantage Actor-Critic)",
        "family": "Actor-Critic",
        "tag": "Synchronous Actor-Critic",
        "class": A2CAgent,
        "description": "Synchronous actor-critic estimating 1-step TD advantage to update policy and baseline simultaneously."
    },
    "ppo": {
        "id": "ppo",
        "name": "PPO (Proximal Policy Optimization)",
        "family": "Actor-Critic (Policy Optimization)",
        "tag": "Clipped Surrogate Objective",
        "class": PPOAgent,
        "description": "State-of-the-art policy optimization with clipped probability ratios and GAE to prevent policy degradation."
    },
    "dqn": {
        "id": "dqn",
        "name": "DQN (Deep Q-Network)",
        "family": "Deep RL (Value-Based)",
        "tag": "Experience Replay + Target Net",
        "class": DQNAgent,
        "description": "Deep Q-Network using neural function approximation, experience replay, and periodic target updates."
    },
    "double_dqn": {
        "id": "double_dqn",
        "name": "Double DQN",
        "family": "Deep RL (Value-Based)",
        "tag": "Decoupled Q-Target",
        "class": DoubleDQNAgent,
        "description": "Decouples greedy action selection (online net) from evaluation (target net) to mitigate overestimation bias."
    },
    "ddpg": {
        "id": "ddpg",
        "name": "DDPG (Deep Deterministic PG)",
        "family": "Deep RL (Actor-Critic)",
        "tag": "Deterministic Policy Gradient",
        "class": DDPGAgent,
        "description": "Off-policy actor-critic using deterministic policy gradients, continuous action evaluation, and Polyak soft updates."
    }
}

__all__ = [
    "BaseQueueAgent",
    "QLearningAgent",
    "SarsaAgent",
    "ContextualBanditAgent",
    "ReinforceAgent",
    "A2CAgent",
    "PPOAgent",
    "DQNAgent",
    "DoubleDQNAgent",
    "DDPGAgent",
    "AVAILABLE_MODELS"
]
