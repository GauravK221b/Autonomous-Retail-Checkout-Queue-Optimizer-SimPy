import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import PolicyStudioView from './components/PolicyStudioView';
import SimPyView from './components/SimPyView';
import BenchmarkLogsView from './components/BenchmarkLogsView';
import ConfigModal from './components/ConfigModal';
import CheckoutLanesView from './components/CheckoutLanesView';
import SimulationControls from './components/SimulationControls';
import ComparativeAnalysisView from './components/ComparativeAnalysisView';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState(() => localStorage.getItem('optiqueue_theme') || 'dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Status & Telemetry
  const [backendConnected, setBackendConnected] = useState(false);
  const [trainedEpisodes, setTrainedEpisodes] = useState(250);
  const [serviceRates, setServiceRates] = useState([0.6, 0.4, 0.3]);
  const [maxQueueLen, setMaxQueueLen] = useState(5);
  const [availableModels, setAvailableModels] = useState([]);

  // Interactive Simulation State
  const [currentQueues, setCurrentQueues] = useState([1, 1, 0]);
  const [lastAction, setLastAction] = useState(null);
  const [lastServed, setLastServed] = useState([false, false, false]);
  const [qValues, setQValues] = useState([0, 0, 0]);
  const [recommendedAction, setRecommendedAction] = useState(0);

  // Active Model & Policy Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState('q_learning');
  const [speed, setSpeed] = useState(1000);
  const [stepCount, setStepCount] = useState(0);
  const [totalReward, setTotalReward] = useState(0);

  // Benchmark & Historical Data
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [simpyData, setSimpyData] = useState(null);

  const autoPlayTimerRef = useRef(null);

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('optiqueue_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        const status = await api.getStatus();
        if (isMounted) {
          setBackendConnected(status.status === 'online');
          setTrainedEpisodes(status.trainedEpisodes);
          setServiceRates(status.serviceRates);
          setMaxQueueLen(status.maxQueueLen);
          if (status.models) setAvailableModels(status.models);
        }

        // Run default multi-model benchmark
        const bench = await api.runBenchmark(100, status.serviceRates);
        if (isMounted) {
          setBenchmarkData(bench);
        }

        // Reset interactive state
        const initialInteractive = await api.resetInteractive();
        if (isMounted) {
          setCurrentQueues(initialInteractive.state);
          setQValues(initialInteractive.qValues);
          setRecommendedAction(initialInteractive.recommendedAction);
        }

        // Fetch initial SimPy arena run
        const simpyRes = await api.runSimPy({ arrivalRate: 1.0, simulationTime: 120 });
        if (isMounted) {
          setSimpyData(simpyRes);
        }
      } catch (err) {
        console.warn('Initial backend fetch encountered error, fallback active:', err);
      }
    }

    initData();

    // Health check ping interval
    const pingInterval = setInterval(async () => {
      try {
        const s = await api.getStatus();
        if (isMounted) {
          setBackendConnected(s.status === 'online');
          if (s.models) setAvailableModels(s.models);
        }
      } catch {
        if (isMounted) setBackendConnected(false);
      }
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
    };
  }, []);

  // Sync Q-values and action recommendation when mode switches
  useEffect(() => {
    if (['q_learning', 'sarsa', 'bandit', 'reinforce', 'a2c', 'ppo', 'dqn', 'double_dqn', 'ddpg'].includes(mode)) {
      api.getQValues(currentQueues[0], currentQueues[1], currentQueues[2], mode)
        .then((res) => {
          setQValues(res.qValues);
          setRecommendedAction(res.bestAction);
        })
        .catch(console.error);
    }
  }, [mode]);

  // Step Handler
  const handleStep = async (actionOverride = null) => {
    try {
      const res = await api.stepInteractive(actionOverride, mode);
      setCurrentQueues(res.nextState);
      setLastAction(res.action);
      setLastServed(res.served);
      setQValues(res.qValues);
      setRecommendedAction(res.recommendedAction);
      setStepCount(res.step);
      setTotalReward((prev) => prev + res.reward);
    } catch (err) {
      console.error('Interactive step failed:', err);
    }
  };

  // Reset Handler
  const handleReset = async () => {
    setIsPlaying(false);
    try {
      const res = await api.resetInteractive(mode);
      setCurrentQueues(res.state);
      setLastAction(null);
      setLastServed([false, false, false]);
      setQValues(res.qValues);
      setRecommendedAction(res.recommendedAction);
      setStepCount(0);
      setTotalReward(0);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  // Auto-play loop
  useEffect(() => {
    if (isPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        handleStep();
      }, speed);
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isPlaying, speed, mode]);

  // Run Benchmark Handler
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await api.runBenchmark(100, serviceRates, mode);
      setBenchmarkData(res);
    } catch (err) {
      console.error('Benchmark run failed:', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Retrain Handler
  const handleRetrain = async (config) => {
    setIsTraining(true);
    try {
      const res = await api.train(config);
      setTrainedEpisodes(res.episodes);
      setTrainingHistory(res.history);
      if (config.serviceRates) {
        setServiceRates(config.serviceRates);
      }
      // Re-run multi-model benchmark with newly trained parameters
      const bench = await api.runBenchmark(100, config.serviceRates);
      setBenchmarkData(bench);
      // Re-run SimPy arena
      const simpyRes = await api.runSimPy({ arrivalRate: 1.0, simulationTime: 120 });
      setSimpyData(simpyRes);
    } catch (err) {
      console.error('Training failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const totalWaiting = currentQueues.reduce((a, b) => a + b, 0);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        theme={theme}
        toggleTheme={toggleTheme}
        backendConnected={backendConnected}
        trainedEpisodes={trainedEpisodes}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          activeTab={activeTab}
          onRunBenchmark={handleRunBenchmark}
          onResetQueues={handleReset}
          isBenchmarking={isBenchmarking}
          totalWaiting={totalWaiting}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="page-body">
          {activeTab === 'overview' && (
            <OverviewView
              benchmarkData={benchmarkData}
              currentQueues={currentQueues}
              serviceRates={serviceRates}
              maxQueueLen={maxQueueLen}
              lastAction={lastAction}
              lastServed={lastServed}
              qValues={qValues}
              recommendedAction={recommendedAction}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onStep={() => handleStep()}
              onReset={handleReset}
              mode={mode}
              setMode={setMode}
              speed={speed}
              setSpeed={setSpeed}
              stepCount={stepCount}
              totalReward={totalReward}
              onManualDispatch={(laneId) => handleStep(laneId)}
            />
          )}

          {activeTab === 'comparison' && (
            <ComparativeAnalysisView />
          )}

          {activeTab === 'simulation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <SimulationControls
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onStep={() => handleStep()}
                onReset={handleReset}
                mode={mode}
                setMode={setMode}
                speed={speed}
                setSpeed={setSpeed}
                stepCount={stepCount}
                totalReward={totalReward}
              />

              <CheckoutLanesView
                queues={currentQueues}
                maxQueueLen={maxQueueLen}
                serviceRates={serviceRates}
                lastAction={lastAction}
                lastServed={lastServed}
                qValues={qValues}
                recommendedAction={recommendedAction}
                mode={mode}
                onManualDispatch={(laneId) => handleStep(laneId)}
              />
            </div>
          )}

          {activeTab === 'policy' && (
            <PolicyStudioView
              trainingHistory={trainingHistory}
              onRetrain={handleRetrain}
              isTraining={isTraining}
            />
          )}

          {activeTab === 'simpy' && (
            <SimPyView initialData={simpyData} />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkLogsView benchmarkData={benchmarkData} />
          )}

          {activeTab === 'config' && (
            <ConfigModal
              serviceRates={serviceRates}
              onUpdateConfig={handleRetrain}
              isTraining={isTraining}
            />
          )}
        </main>
      </div>
    </div>
  );
}
