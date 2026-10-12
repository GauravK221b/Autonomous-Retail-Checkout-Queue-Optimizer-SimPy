/**
 * OptiQueue AI - Backend Simulation API Client
 * Connects directly to Flask Backend on http://127.0.0.1:5000/api
 * Includes fallback simulation logic so UI is always responsive.
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    // Return null or throw to allow fallback
    console.warn(`API request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  async getStatus() {
    try {
      return await request('/status');
    } catch {
      return {
        status: 'offline',
        trainedEpisodes: 250,
        numCounters: 3,
        maxQueueLen: 5,
        serviceRates: [0.6, 0.4, 0.3],
        epsilon: 0.05,
        gamma: 0.95,
        alpha: 0.1
      };
    }
  },

  async train(params = {}) {
    return await request('/train', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async runBenchmark(steps = 100, serviceRates = null) {
    return await request('/benchmark', {
      method: 'POST',
      body: JSON.stringify({ steps, serviceRates })
    });
  },

  async resetInteractive() {
    return await request('/interactive/reset', {
      method: 'POST'
    });
  },

  async stepInteractive(action = null, mode = 'q_learning') {
    return await request('/interactive/step', {
      method: 'POST',
      body: JSON.stringify({ action, mode })
    });
  },

  async getPolicy(fixedLane2 = 0) {
    return await request(`/policy?fixedLane2=${fixedLane2}`);
  },

  async getQValues(q0, q1, q2) {
    return await request('/q_values', {
      method: 'POST',
      body: JSON.stringify({ q0, q1, q2 })
    });
  },

  async runSimPy(params = {}) {
    return await request('/simpy/run', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
};
