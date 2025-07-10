
import React, { useContext, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Module, ItemTypes, Point, ModuleType, ContextMenuItem } from '../types';
import { CanvasContext } from '../context/CanvasContext';
import { ALL_MODULE_DEFINITIONS } from '../constants';
import { Trash2, Link, PlayCircle, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ModuleNodeProps {
  module: Module;
  showContextMenu: (position: Point, items: ContextMenuItem[]) => void;
}

export const ModuleNode: React.FC<ModuleNodeProps> = ({ module, showContextMenu }) => {
  const { state, dispatch } = useContext(CanvasContext);
  const { selectedModuleId, connections, aiHighlightModuleIds } = state;
  const { addToast } = useToast();
  const nodeRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.MODULE,
    item: { id: module.id, type: 'node' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (delta && Math.abs(delta.x) > 1 && Math.abs(delta.y) > 1) { // Threshold to prevent firing on click
            const newPosition = {
                x: Math.round(module.position.x + delta.x),
                y: Math.round(module.position.y + delta.y)
            };
            dispatch({ type: 'MOVE_MODULE', payload: { id: module.id, position: newPosition }});
        }
    }
  }), [module.id, module.position.x, module.position.y, dispatch]);
  
  const dragRef = useRef<HTMLDivElement>(null);
  drag(dragRef);

  const isSelected = selectedModuleId === module.id;
  const isHighlightedByAI = aiHighlightModuleIds.includes(module.id);
  const definition = ALL_MODULE_DEFINITIONS[module.type];

  const IconComponent = (Icons as any)[definition.icon] || HelpCircle;

  const colorClass = definition.color || 'bg-gray-500';
  const gradientClass = colorClass.replace('bg-', 'from-') + " " + colorClass.replace('bg-', 'to-').replace('500', '700').replace('600', '800');

  const handleSimulateFlow = () => {
    const outgoingConnectionIds = Object.values(connections)
        .filter(conn => conn.fromModuleId === module.id)
        .map(conn => conn.id);

    if (outgoingConnectionIds.length > 0) {
        dispatch({ type: 'SET_ANIMATIONS', payload: { connectionIds: outgoingConnectionIds } });
        addToast(`Simulating flow from "${module.name}"...`, 'info');
        setTimeout(() => dispatch({ type: 'CLEAR_ANIMATIONS' }), 3000);
    } else {
        addToast('No outgoing connections to simulate.', 'warning');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${module.name}"?`)) {
      dispatch({ type: 'DELETE_MODULE', payload: { id: module.id } });
      addToast(`Deleted "${module.name}".`, 'info');
    }
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_MODULE', payload: { id: module.id } });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const menuItems: ContextMenuItem[] = [
      {
        label: "Simulate Flow",
        icon: <PlayCircle size={16}/>,
        action: handleSimulateFlow,
      },
      {
        label: "Delete Module",
        icon: <Trash2 size={16}/>,
        action: handleDelete,
      },
    ];
    showContextMenu({x: e.clientX, y: e.clientY}, menuItems);
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (module.type === ModuleType.MultiAgentTeam) {
        e.stopPropagation();
        dispatch({ type: 'VIEW_TEAM_CANVAS', payload: { id: module.id } });
    }
  };
  
  const handleStartConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        const scrollContainer = document.querySelector('.overflow-auto');
        if (!scrollContainer) return;
        
        const containerRect = scrollContainer.getBoundingClientRect();

        const startPos: Point = { 
            x: rect.left - containerRect.left + rect.width + scrollContainer.scrollLeft,
            y: rect.top - containerRect.top + rect.height / 2 + scrollContainer.scrollTop
        };
        dispatch({ type: 'START_CONNECTION', payload: { moduleId: module.id, position: startPos } });
    }
  };

  const handleEndConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'END_CONNECTION', payload: { toModuleId: module.id } });
  };
  
  const hasStatus = module.status && Object.keys(module.status).length > 0;

  return (
    <div
      ref={nodeRef}
      style={{
        transform: `translate(${module.position.x}px, ${module.position.y}px)`,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`absolute group w-72 ${isHighlightedByAI ? 'ai-highlight' : ''}`}
      onClick={handleNodeClick}
      onDoubleClick={handleDoubleClick}
      onMouseUp={handleEndConnection}
      onContextMenu={handleContextMenu}
    >
        <div 
          ref={dragRef} 
          className={`flex flex-col w-full min-h-20 p-3 rounded-xl shadow-lg cursor-move border-2 transition-all duration-300 glass-pane ${isSelected ? 'border-sky-400 scale-105' : 'border-transparent hover:border-border-color'}`}
          style={{
            boxShadow: isSelected ? '0 0 35px rgba(14, 165, 233, 0.5)' : undefined,
          }}
        >
            <div className="flex items-start gap-3">
                <div className={`relative bg-gradient-to-br ${gradientClass} p-2 rounded-lg text-white mt-1 shadow-inner shadow-black/20`}>
                    <IconComponent size={24} />
                    <div className={`absolute -inset-1 rounded-lg ${colorClass} opacity-50 blur-md group-hover:opacity-75 ${isSelected ? '!opacity-100 !blur-2xl' : ''} transition-all duration-300`}></div>
                    <div className={`absolute -inset-0 rounded-lg ring-1 ring-inset ring-white/10 ${isSelected ? `ring-accent/80` : ''}`}></div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-md font-bold truncate text-text-primary">{module.name}</p>
                    <p className="text-xs text-text-secondary">{module.type}</p>
                     {module.type === ModuleType.MultiAgentTeam && <p className="text-xs text-accent/80 italic mt-1">Double-click to view team</p>}
                </div>
            </div>
            
            {hasStatus && (
                <div className="mt-3 pt-2 border-t border-border-color/50 space-y-1">
                    {Object.entries(module.status!).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-xs">
                            <span className="text-text-secondary capitalize">{key}</span>
                            <span className="font-mono text-accent bg-canvas-bg px-1.5 py-0.5 rounded">{value}</span>
                        </div>
                    ))}
                </div>
            )}
            
             <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onMouseDown={handleStartConnection}
                    className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white hover:bg-accent-hover shadow-lg"
                    title="Start connection"
                >
                    <Link size={14} />
                </button>
            </div>
            {isSelected && (
                 <button
                    onClick={handleDelete}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors shadow-lg"
                    title="Delete module"
                 >
                    <Trash2 size={14}/>
                 </button>
            )}
        </div>
    </div>
  );
};
