import React, { useContext, useRef, useCallback, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ItemTypes, Point, InternalModule, InternalConnection, InternalModuleType, ModuleInfo } from '../types';
import { CanvasContext } from '../context/CanvasContext';
import { TEAM_CANVAS_MODULE_DEFINITIONS } from '../constants';
import { Link, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

interface TeamCanvasProps {
    teamId: string;
}

const InternalSidebarItem: React.FC<{ moduleInfo: Omit<ModuleInfo, 'type'> & {type: InternalModuleType} }> = ({ moduleInfo }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.INTERNAL_MODULE,
    item: { type: moduleInfo.type },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  const dragRef = useRef<HTMLDivElement>(null);
  drag(dragRef);
  
  const IconComponent = (Icons as any)[moduleInfo.icon] || HelpCircle;

  return (
    <div
      ref={dragRef}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 border-transparent cursor-grab transition-all duration-200 ${isDragging ? 'opacity-50 bg-accent' : 'bg-panel-bg hover:border-accent'}`}
    >
      <div className={`${moduleInfo.color} p-2 rounded-md text-white`}><IconComponent size={24}/></div>
      <span className="font-medium text-sm">{moduleInfo.type}</span>
    </div>
  );
};


const InternalModuleNode: React.FC<{ module: InternalModule }> = ({ module }) => {
    const { state, dispatch } = useContext(CanvasContext);
    const { selectedModuleId } = state;
    const isSelected = selectedModuleId === module.id;
    const definition = TEAM_CANVAS_MODULE_DEFINITIONS[module.type];
    const nodeRef = useRef<HTMLDivElement>(null);

     const [, drag] = useDrag(() => ({
        type: ItemTypes.INTERNAL_MODULE, 
        item: { id: module.id, type: 'node' },
        end: (item, monitor) => {
            const delta = monitor.getDifferenceFromInitialOffset();
            if (delta) {
                const newPosition = {
                    x: module.position.x + delta.x,
                    y: module.position.y + delta.y
                };
                dispatch({ type: 'MOVE_MODULE', payload: { id: module.id, position: newPosition }});
            }
        }
    }), [module.id, module.position.x, module.position.y, dispatch]);

    const dragRef = useRef<HTMLDivElement>(null);
    drag(dragRef);

    const handleStartConnection = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(nodeRef.current) {
            const canvasRect = document.getElementById('team-canvas-area')?.getBoundingClientRect();
            if (!canvasRect) return;

            const rect = nodeRef.current.getBoundingClientRect();
            const startPos: Point = { 
                x: rect.left - canvasRect.left + rect.width,
                y: rect.top - canvasRect.top + rect.height / 2 
            };
            dispatch({ type: 'START_CONNECTION', payload: { moduleId: module.id, position: startPos } });
        }
    };

    const handleEndConnection = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({ type: 'END_CONNECTION', payload: { toModuleId: module.id } });
    };

    if (!definition) return null;
    const IconComponent = (Icons as any)[definition.icon] || HelpCircle;
    const colorClass = definition.color || 'bg-gray-500';
    const gradientClass = colorClass.replace('bg-', 'from-') + " " + colorClass.replace('bg-', 'to-').replace('500', '700').replace('600', '800');

    return (
         <div
            ref={nodeRef}
            onClick={(e) => { e.stopPropagation(); dispatch({type: 'SELECT_MODULE', payload: {id: module.id}}) }}
            onMouseUp={handleEndConnection}
            style={{ transform: `translate(${module.position.x}px, ${module.position.y}px)` }}
            className={`absolute group w-60`}
        >
            <div ref={dragRef} className={`flex items-center gap-3 p-3 rounded-lg shadow-md border-2 cursor-move ${isSelected ? 'border-accent scale-105' : 'border-border-color'} bg-panel-bg transition-all`}>
                <div className={`bg-gradient-to-br ${gradientClass} p-2 rounded-md text-white`}>
                    <IconComponent size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="font-bold truncate text-text-primary text-sm">{module.name}</p>
                    <p className="text-xs text-text-secondary">{module.type}</p>
                </div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onMouseDown={handleStartConnection}
                        className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white hover:bg-accent-hover"
                        title="Start connection"
                    >
                        <Link size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};


const TeamCanvas: React.FC<TeamCanvasProps> = ({ teamId }) => {
  const { state, dispatch } = useContext(CanvasContext);
  const { modules, newConnectionStart } = state;
  const teamModule = modules[teamId];
  
  const internalCanvas = teamModule?.internalCanvas;
  const internalModules = internalCanvas?.modules || {};
  const internalConnections = internalCanvas?.connections || {};

  const canvasRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.INTERNAL_MODULE,
    drop: (item: { type: InternalModuleType } | { id: string; type: 'node' }, monitor) => {
      if ('id' in item) return; // It's an existing node being moved, not a new one from the sidebar
      
      const delta = monitor.getClientOffset();
      if (delta && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const position = {
          x: delta.x - canvasRect.left,
          y: delta.y - canvasRect.top,
        };
        dispatch({ type: 'ADD_INTERNAL_MODULE', payload: { teamId, type: item.type, position } });
      }
    },
  }), [dispatch, teamId]);

  const dropRef = useRef<HTMLDivElement>(null);
  drop(dropRef);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dispatch({ type: 'CANCEL_CONNECTION' });
  }, [dispatch]);
  
  useEffect(() => {
    if (newConnectionStart) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [newConnectionStart, handleMouseMove, handleMouseUp]);
  
  const getModuleCenter = (moduleId: string): Point => {
    const module = internalModules[moduleId];
    if (!module) return { x: 0, y: 0 };
    return { x: module.position.x + 240 / 2, y: module.position.y + 72 / 2 };
  };

  const handleCanvasClick = () => {
    dispatch({ type: 'SELECT_MODULE', payload: { id: null } });
  }

  return (
    <div className="w-full h-full flex">
      <aside className="w-64 bg-sidebar-bg/50 p-2 flex flex-col gap-2 shrink-0 border-r border-border-color">
         <h3 className="font-bold text-text-primary p-2">Team Toolkit</h3>
         {Object.entries(TEAM_CANVAS_MODULE_DEFINITIONS).map(([type, info]) => (
            <InternalSidebarItem key={type} moduleInfo={{...(info as any), type: type as InternalModuleType}} />
         ))}
      </aside>
      <div
        ref={dropRef}
        className="w-full h-full relative overflow-auto bg-transparent"
        onClick={handleCanvasClick}
      >
        <div 
          id="team-canvas-area"
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(rgba(160,160,160,0.3) 0.5px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        >
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrow-internal" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="6" markerHeight="6"
                  orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a0a0a0" />
              </marker>
            </defs>
            {Object.values(internalConnections).map((conn: InternalConnection) => {
              const fromModule = internalModules[conn.fromModuleId];
              const toModule = internalModules[conn.toModuleId];
              if (!fromModule || !toModule) return null;

              const from = getModuleCenter(conn.fromModuleId);
              const to = getModuleCenter(conn.toModuleId);
              const pathData = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
            
              return (
                <g key={conn.id} className="connection-group" style={{ pointerEvents: 'all' }}>
                  <path
                    d={pathData}
                    stroke="#a0a0a0"
                    strokeWidth="1.5"
                    fill="none"
                    markerEnd="url(#arrow-internal)"
                    className="connection-path"
                  />
                </g>
              );
            })}
            {newConnectionStart && (
              <path
                d={`M ${newConnectionStart.position.x} ${newConnectionStart.position.y} L ${mousePosition.x} ${mousePosition.y}`}
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
              />
            )}
          </svg>

          {Object.values(internalModules).map((module: InternalModule) => (
              <InternalModuleNode key={module.id} module={module}/>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamCanvas;