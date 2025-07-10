
import React, { useContext, useEffect } from 'react';
import ConfigPanel from './ConfigPanel';
import GeminiAssistant from './GeminiAssistant';
import { CanvasContext } from '../context/CanvasContext';
import { SlidersHorizontal, MessageSquare } from 'lucide-react';
import { useUI } from '../context/UIContext';

const RightPanel: React.FC = () => {
  const { state } = useContext(CanvasContext);
  const { selectedModuleId, selectedConnectionId } = state;
  const { rightPanelTab, setRightPanelTab } = useUI();

  useEffect(() => {
    if (selectedModuleId || selectedConnectionId) {
      setRightPanelTab('config');
    }
  }, [selectedModuleId, selectedConnectionId, setRightPanelTab]);

  return (
    <aside className="w-96 bg-sidebar-bg flex flex-col h-full shrink-0 border-l border-border-color glass-pane">
      <div className="flex border-b border-border-color">
        <button
          onClick={() => setRightPanelTab('config')}
          className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${rightPanelTab === 'config' ? 'bg-panel-bg text-accent' : 'text-text-secondary hover:bg-panel-bg'}`}
        >
          <SlidersHorizontal size={16} />
          Configure
        </button>
        <button
          onClick={() => setRightPanelTab('assistant')}
          className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${rightPanelTab === 'assistant' ? 'bg-panel-bg text-accent' : 'text-text-secondary hover:bg-panel-bg'}`}
        >
          <MessageSquare size={16} />
          Assistant
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-panel-bg">
        {rightPanelTab === 'config' && <ConfigPanel />}
        {rightPanelTab === 'assistant' && <GeminiAssistant />}
      </div>
    </aside>
  );
};

export default RightPanel;