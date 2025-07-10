
import React, { useContext, useRef } from 'react';
import { Save, Upload, Image as ImageIcon, BrainCircuit, FilePlus, Camera } from 'lucide-react';
import { CanvasContext } from '../context/CanvasContext';
import { useToast } from '../context/ToastContext';
import { useUI } from '../context/UIContext';

const Header: React.FC = () => {
  const { state, dispatch } = useContext(CanvasContext);
  const { addToast } = useToast();
  const { setCameraModalOpen } = useUI();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleNewProject = () => {
    if (window.confirm('Are you sure you want to start a new project? All unsaved changes will be lost.')) {
        dispatch({ type: 'CLEAR_CANVAS' });
        addToast('New project started.', 'info');
    }
  };

  const handleSave = () => {
    const dataToSave = {
        modules: state.modules,
        connections: state.connections,
    };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-system-architect.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Design saved successfully!', 'success');
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const loadedState = JSON.parse(text);
          if (loadedState.modules && loadedState.connections) {
            dispatch({ type: 'LOAD_STATE', payload: loadedState });
            addToast('Design loaded successfully!', 'success');
          } else {
            addToast('Invalid file format.', 'error');
          }
        }
      } catch (error) {
        console.error("Failed to load or parse file", error);
        addToast('Failed to load file. It might be corrupted.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = () => {
    const canvasElement = document.getElementById('canvas-export-area');
    if (canvasElement && (window as any).html2canvas) {
      (window as any).html2canvas(canvasElement, { backgroundColor: null }).then((canvas: HTMLCanvasElement) => {
        const image = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = image;
        a.download = 'ai-system-diagram.png';
        a.click();
        addToast('Exported as PNG!', 'success');
      });
    } else {
        addToast("Could not find canvas element or library.", 'error');
    }
  };

  return (
    <header className="flex items-center justify-between p-2 bg-sidebar-bg border-b border-border-color text-text-primary h-14 shrink-0 z-20 glass-pane">
      <div className="flex items-center gap-3">
        <BrainCircuit className="text-accent" size={28} />
        <h1 className="text-xl font-bold">AI System Architect</h1>
      </div>
       <div className="hidden md:flex items-center gap-2 text-text-secondary text-sm">
        <span>Cmd/Ctrl + K to open Command Palette</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleNewProject} className="flex items-center gap-2 px-3 py-2 rounded-md bg-panel-bg hover:bg-accent hover:text-white transition-colors">
          <FilePlus size={18} />
          <span className="hidden md:inline">New</span>
        </button>
        <button onClick={handleSave} className="flex items-center gap-2 px-3 py-2 rounded-md bg-panel-bg hover:bg-accent hover:text-white transition-colors">
          <Save size={18} />
          <span className="hidden md:inline">Save</span>
        </button>
        <button onClick={handleLoadClick} className="flex items-center gap-2 px-3 py-2 rounded-md bg-panel-bg hover:bg-accent hover:text-white transition-colors">
          <Upload size={18} />
          <span className="hidden md:inline">Load</span>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-md bg-panel-bg hover:bg-accent hover:text-white transition-colors">
          <ImageIcon size={18} />
          <span className="hidden md:inline">Export PNG</span>
        </button>
         <button onClick={() => setCameraModalOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-panel-bg hover:bg-accent hover:text-white transition-colors">
          <Camera size={18} />
          <span className="hidden md:inline">Scan Diagram</span>
        </button>
      </div>
    </header>
  );
};

export default Header;