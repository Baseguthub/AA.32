
import React, { useContext, useRef, useCallback, useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes, ModuleType, Module as ModuleData, Point, Connection, ContextMenuItem } from '../types';
import { CanvasContext } from '../context/CanvasContext';
import { ModuleNode } from './ModuleNode';
import { ALL_MODULE_DEFINITIONS } from '../constants';
import TeamCanvas from './TeamCanvas';
import { v4 as uuidv4 } from 'uuid';

interface CanvasProps {
  showContextMenu: (position: Point, items: ContextMenuItem[]) => void;
}

const Canvas: React.FC<CanvasProps> = ({ showContextMenu }) => {
  const { state, dispatch } = useContext(CanvasContext);
  const { modules, connections, newConnectionStart, animatedConnections, selectedConnectionId, viewingTeamId } = state;
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.MODULE,
    drop: (item: { type: ModuleType } | { id: string; type: 'node' }, monitor) => {
       // This check is to differentiate between new modules from the sidebar and existing nodes being dragged
      if ('id' in item) { 
        return; 
      }
      
      if (viewingTeamId) { // Do not drop main modules into a team canvas
        return;
      }

      const delta = monitor.getClientOffset();
      if (delta && scrollContainerRef.current) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const newModule: ModuleData = {
          id: uuidv4(),
          type: item.type,
          name: ALL_MODULE_DEFINITIONS[item.type].defaultName,
          position: {
            x: delta.x - containerRect.left + scrollContainerRef.current.scrollLeft,
            y: delta.y - containerRect.top + scrollContainerRef.current.scrollTop,
          },
          status: {},
          ...(item.type === ModuleType.MultiAgentTeam && { agents: [] }),
        };
        dispatch({ type: 'ADD_MODULE', payload: { module: newModule } });
      }
    },
  }), [dispatch, viewingTeamId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateViewport = () => {
      dispatch({
        type: 'UPDATE_VIEWPORT',
        payload: {
          scroll: { x: container.scrollLeft, y: container.scrollTop },
          size: { width: container.clientWidth, height: container.clientHeight }
        }
      });
    };

    updateViewport(); // Initial update
    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(container);
    container.addEventListener('scroll', updateViewport);
    
    return () => {
      resizeObserver.unobserve(container);
      container.removeEventListener('scroll', updateViewport);
    }
  }, [dispatch]);


  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (scrollContainerRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        setMousePosition({ 
          x: e.clientX - rect.left + scrollContainerRef.current.scrollLeft,
          y: e.clientY - rect.top + scrollContainerRef.current.scrollTop
        });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dispatch({ type: 'CANCEL_CONNECTION' });
  }, [dispatch]);
  
  useEffect(() => {
    const currentContainer = scrollContainerRef.current;
    if (newConnectionStart && currentContainer) {
        currentContainer.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
       if (currentContainer) {
        currentContainer.removeEventListener('mousemove', handleMouseMove);
       }
       window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [newConnectionStart, handleMouseMove, handleMouseUp]);
  
  const getModuleCenter = (moduleId: string): Point => {
    const module = modules[moduleId];
    if (!module) return { x: 0, y: 0 };
    return { x: module.position.x + 288 / 2, y: module.position.y + 80 / 2 };
  };

  const handleCanvasClick = () => {
    dispatch({ type: 'SELECT_MODULE', payload: { id: null } });
    dispatch({ type: 'SELECT_CONNECTION', payload: { id: null } });
  }

  if(viewingTeamId) {
    return <TeamCanvas teamId={viewingTeamId} />;
  }

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        scrollContainerRef.current = node;
        drop(node);
      }}
      className="w-full h-full relative overflow-auto bg-canvas-bg"
      onClick={handleCanvasClick}
    >
      <div 
        id="canvas-export-area"
        ref={canvasRef}
        className="absolute top-0 left-0"
         style={{
          width: '3000px', // Large canvas area
          height: '3000px',
          backgroundImage: 'radial-gradient(#4a4a4f 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
      >
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <defs>
               <linearGradient id="packet-gradient" x1="100%" y1="50%" x2="0%" y2="50%">
                  <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                  <stop offset="40%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="flow-glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a5b4fc" />
                  <stop offset="50%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6"
                orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a0a0a0" />
            </marker>
             <marker id="arrow-selected" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6"
                orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7dd3fc" />
            </marker>
          </defs>
          {Object.values(connections).map((conn: Connection) => {
             const fromModule = modules[conn.fromModuleId];
             const toModule = modules[conn.toModuleId];
             if (!fromModule || !toModule) return null;

            const from = getModuleCenter(conn.fromModuleId);
            const to = getModuleCenter(conn.toModuleId);
            const pathData = `M ${from.x} ${from.y} C ${from.x + 80} ${from.y}, ${to.x - 80} ${to.y}, ${to.x} ${to.y}`;
            const isAnimated = animatedConnections.includes(conn.id);
            const isSelected = selectedConnectionId === conn.id;
            const pathId = `path-${conn.id}`;

            return (
              <g 
                key={conn.id} 
                className={`connection-group ${isSelected ? 'selected' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SELECT_CONNECTION', payload: { id: conn.id } });
                }}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
              >
                <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" />
                <path
                  id={pathId}
                  d={pathData}
                  stroke={isSelected ? "#7dd3fc" : "#a0a0a0"}
                  strokeWidth={isSelected ? 3 : 2}
                  fill="none"
                  markerEnd={isSelected ? "url(#arrow-selected)" : "url(#arrow)"}
                  className="connection-path"
                />

                {!isAnimated && conn.label && (
                    <text dy="-5" className="connection-label">
                        <textPath href={`#${pathId}`} startOffset="50%">
                            {conn.label}
                        </textPath>
                    </text>
                )}

                {isAnimated && (
                  <>
                    <path
                      d={pathData}
                      fill="none"
                      className="connection-glow-base"
                    />
                     <path
                      d={pathData}
                      stroke="#fff"
                      strokeWidth="1.5"
                      fill="none"
                      strokeOpacity="0.4"
                      style={{filter: 'blur(1px)', pointerEvents: 'none'}}
                    />
                    <g className="flow-packet-visual pointer-events-none">
                       <path d="M -25 -12 L 15 0 L -25 12 Q -15 0 -25 -12 Z" fill="url(#packet-gradient)">
                         <animateMotion dur="2.5s" repeatCount="indefinite" rotate="auto" path={pathData} />
                       </path>
                       <text className="packet-label" x="-5" y="0.5">
                         <animateMotion dur="2.5s" repeatCount="indefinite" rotate="auto" path={pathData} />
                         {conn.label}
                       </text>
                    </g>
                  </>
                )}
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

        {Object.values(modules).map((module: ModuleData) => (
          <ModuleNode key={module.id} module={module} showContextMenu={showContextMenu}/>
        ))}
      </div>
    </div>
  );
};

export default Canvas;