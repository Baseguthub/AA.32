
import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CanvasProvider } from './context/CanvasContext';
import { ToastProvider } from './context/ToastContext';
import { AssistantProvider } from './context/AssistantContext';
import { UIProvider, useUI } from './context/UIContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import Breadcrumbs from './components/Breadcrumbs';
import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/ToastContainer';
import ContextMenu from './components/ContextMenu';
import CameraModal from './components/CameraModal';
import { Point, ContextMenuItem, ContextMenuState } from './types';

const AppContent: React.FC = () => {
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    items: [],
  });
  const { isCameraModalOpen, setCameraModalOpen } = useUI();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
      setContextMenu(prev => ({ ...prev, visible: false }));
      setCameraModalOpen(false);
    }
  }, [setCameraModalOpen]);

  const handleShowContextMenu = (position: Point, items: ContextMenuItem[]) => {
    setContextMenu({ visible: true, position, items });
  };
  
  const handleCloseContextMenu = useCallback(() => {
     setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleCloseContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('click', handleCloseContextMenu);
    };
  }, [handleKeyDown, handleCloseContextMenu]);

  return (
    <DndProvider backend={HTML5Backend}>
      <CanvasProvider>
        <div className="flex flex-col h-screen w-screen bg-transparent font-sans overflow-hidden">
          <div className="aurora-background fixed top-0 left-0 w-full h-full" />
          <Header />
          <div className="flex flex-1 overflow-hidden z-10">
            <PanelGroup direction="horizontal">
              <Panel defaultSize={20} minSize={15} maxSize={30}>
                <Sidebar />
              </Panel>
              <PanelResizeHandle />
              <Panel>
                <div className="flex flex-1 flex-col h-full relative">
                  <Breadcrumbs />
                  <main className="flex-1 h-full relative">
                    <Canvas showContextMenu={handleShowContextMenu} />
                  </main>
                </div>
              </Panel>
              <PanelResizeHandle />
              <Panel defaultSize={25} minSize={20} maxSize={40}>
                <RightPanel />
              </Panel>
            </PanelGroup>
          </div>
          {isCommandPaletteOpen && <CommandPalette onClose={() => setCommandPaletteOpen(false)} />}
        </div>
        <ToastContainer />
        <ContextMenu {...contextMenu} onClose={handleCloseContextMenu} />
        <CameraModal isOpen={isCameraModalOpen} onClose={() => setCameraModalOpen(false)} />
      </CanvasProvider>
    </DndProvider>
  );
};


const App: React.FC = () => {
  return (
    <ToastProvider>
      <AssistantProvider>
        <UIProvider>
          <AppContent/>
        </UIProvider>
      </AssistantProvider>
    </ToastProvider>
  );
};

export default App;