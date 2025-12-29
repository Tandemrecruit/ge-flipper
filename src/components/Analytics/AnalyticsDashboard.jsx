import React, { useState } from 'react';
import PriceHistoryChart from './PriceHistoryChart';
import ProfitTimeline from './ProfitTimeline';
import ROIDashboard from './ROIDashboard';
import SmartSuggestions from './SmartSuggestions';
import SuggestionEvaluation from './SuggestionEvaluation';
import BuyLimitTracker from './BuyLimitTracker';
import CompetitionAnalysis from './CompetitionAnalysis';

export default function AnalyticsDashboard({ 
  prices, 
  volumes, 
  mapping, 
  flipLog,
  itemAnalytics,
  onTrackFlip, 
  onAssignToSlot 
}) {
  const [activeView, setActiveView] = useState('roi');

  const views = [
    { id: 'roi', label: 'ROI Dashboard', icon: '📊' },
    { id: 'timeline', label: 'Profit Timeline', icon: '💰' },
    { id: 'priceHistory', label: 'Price History', icon: '📈' },
    { id: 'suggestions', label: 'Smart Suggestions', icon: '🤖' },
    { id: 'accuracy', label: 'Accuracy Analysis', icon: '🎯' },
    { id: 'buyLimits', label: 'Buy Limits', icon: '🛒' },
    { id: 'competition', label: 'Competition', icon: '⚔️' }
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#f5ead6', fontSize: 26 }}>
          📊 Analytics Dashboard
        </h2>
        
        {/* View Selector */}
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          flexWrap: 'wrap',
          marginBottom: 20,
          borderBottom: '1px solid #3a3429',
          paddingBottom: 12
        }}>
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: 16,
                backgroundColor: activeView === view.id ? '#d4a84b' : '#2a2419',
                color: activeView === view.id ? '#151210' : '#f5ead6',
                border: `1px solid ${activeView === view.id ? '#d4a84b' : '#3a3429'}`,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {view.icon} {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active View Content */}
      {activeView === 'roi' && (
        <ROIDashboard 
          flipLog={flipLog}
          itemAnalytics={itemAnalytics}
        />
      )}

      {activeView === 'timeline' && (
        <ProfitTimeline 
          flipLog={flipLog}
        />
      )}

      {activeView === 'priceHistory' && (
        <PriceHistoryChart 
          itemId={null}
          itemName={null}
          prices={prices}
          mapping={mapping}
        />
      )}

      {activeView === 'suggestions' && (
        <SmartSuggestions
          prices={prices}
          volumes={volumes}
          mapping={mapping}
          flipLog={flipLog}
          itemAnalytics={itemAnalytics}
          onTrackFlip={onTrackFlip}
          onAssignToSlot={onAssignToSlot}
        />
      )}

      {activeView === 'accuracy' && (
        <SuggestionEvaluation
          prices={prices}
          volumes={volumes}
          mapping={mapping}
          flipLog={flipLog}
          itemAnalytics={itemAnalytics}
        />
      )}

      {activeView === 'buyLimits' && (
        <BuyLimitTracker 
          flipLog={flipLog}
          mapping={mapping}
        />
      )}

      {activeView === 'competition' && (
        <CompetitionAnalysis
          prices={prices}
          volumes={volumes}
          mapping={mapping}
        />
      )}
    </div>
  );
}
