import React, { useContext } from 'react';
import { CanvasContext } from '../context/CanvasContext';
import { Home, ChevronRight } from 'lucide-react';

const Breadcrumbs: React.FC = () => {
  const { state, dispatch } = useContext(CanvasContext);
  const { viewingTeamId, modules } = state;

  const handleGoHome = () => {
    dispatch({ type: 'VIEW_MAIN_CANVAS' });
  };

  const teamName = viewingTeamId ? modules[viewingTeamId]?.name : null;

  return (
    <nav className="flex items-center p-2 bg-sidebar-bg border-b border-border-color text-sm text-text-secondary h-10 shrink-0 glass-pane">
      <button
        onClick={handleGoHome}
        className="flex items-center gap-1 hover:text-text-primary transition-colors disabled:hover:text-text-secondary disabled:cursor-not-allowed rounded-md px-2 py-1"
        disabled={!viewingTeamId}
      >
        <Home size={16} />
        <span>Main Canvas</span>
      </button>
      {teamName && (
        <>
          <ChevronRight size={16} className="mx-1" />
          <span className="font-semibold text-text-primary bg-accent/20 text-accent px-2 py-1 rounded-md">{teamName}</span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumbs;