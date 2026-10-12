import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  BrainCircuit,
  Clock,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Activity,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  theme,
  toggleTheme,
  backendConnected,
  trainedEpisodes
}) {
  const navItems = [
    { id: 'overview', label: 'Store Overview', icon: LayoutDashboard },
    { id: 'simulation', label: 'Live Checkout Sim', icon: ShoppingCart },
    { id: 'policy', label: 'RL Policy Studio', icon: BrainCircuit },
    { id: 'simpy', label: 'SimPy Event Engine', icon: Clock },
    { id: 'benchmark', label: 'Benchmark & Logs', icon: FileSpreadsheet },
    { id: 'config', label: 'Hyperparameters', icon: Settings }
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <a href="#overview" className="brand-wrapper" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>
          <div className="brand-icon">
            <Sparkles size={22} />
          </div>
          {!isCollapsed && (
            <div className="brand-text-col">
              <span className="brand-name">OptiQueue AI</span>
              <span className="brand-tagline">Retail Queue Optimizer</span>
            </div>
          )}
        </a>
        <button
          className="btn btn-outline btn-sm btn-icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {!isCollapsed && <div className="nav-section-title">Analytics & Control</div>}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={20} className="nav-icon" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="status-pill">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className={`status-dot ${backendConnected ? '' : 'offline'}`} />
              <span style={{ fontWeight: 600 }}>
                {backendConnected ? 'Python API Online' : 'Connecting API...'}
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>
              {trainedEpisodes} Ep
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Color Theme"
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#3b82f6" />}
          </button>
          {!isCollapsed && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
