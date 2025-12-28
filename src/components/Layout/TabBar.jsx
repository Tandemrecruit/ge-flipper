import React from 'react';

export default function TabBar({ activeTab, onTabChange, slotStats, flipLogLength }) {
  return (
    <div className="tab-bar">
      <button 
        className={`tab-btn ${activeTab === 'finder' ? 'active' : ''}`}
        onClick={() => onTabChange('finder')}
      >
        🔍 Item Finder
      </button>
      <button 
        className={`tab-btn ${activeTab === 'slots' ? 'active' : ''}`}
        onClick={() => onTabChange('slots')}
      >
        📦 Slot Allocation ({slotStats?.filled || 0}/{slotStats?.total || 0})
      </button>
      <button 
        className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
        onClick={() => onTabChange('tracker')}
      >
        📊 Flip Tracker {flipLogLength > 0 && `(${flipLogLength})`}
      </button>
      <button 
        className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
        onClick={() => onTabChange('analytics')}
      >
        📈 Analytics
      </button>
      <button 
        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        ⚙️ Settings
      </button>
    </div>
  );
}
