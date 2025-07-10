
import React, { createContext, useReducer, Dispatch, useContext, useEffect } from 'react';
import { Module, Connection, Point, ModuleType, AIAction, Agent, InternalCanvas, InternalModule, InternalModuleType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TEAM_CANVAS_MODULE_DEFINITIONS } from '../constants';

interface CanvasState {
  modules: Record<string, Module>;
  connections: Record<string, Connection>;
  selectedModuleId: string | null;
  selectedConnectionId: string | null;
  newConnectionStart: { moduleId: string; position: Point } | null;
  animatedConnections: string[];
  viewingTeamId: string | null; // ID of the team canvas being viewed
  viewport: {
    scroll: Point;
    size: { width: number, height: number };
  };
  aiHighlightModuleIds: string[];
}

type Action =
  | { type: 'ADD_MODULE'; payload: { module: Module } }
  | { type: 'MOVE_MODULE'; payload: { id: string; position: Point } }
  | { type: 'SELECT_MODULE'; payload: { id: string | null } }
  | { type: 'UPDATE_MODULE_CONFIG'; payload: { id: string; name: string; config?: any; agents?: any } }
  | { type: 'START_CONNECTION'; payload: { moduleId: string; position: Point } }
  | { type: 'END_CONNECTION'; payload: { toModuleId: string } }
  | { type: 'CANCEL_CONNECTION' }
  | { type: 'LOAD_STATE'; payload: { modules: Record<string, Module>; connections: Record<string, Connection> } }
  | { type: 'DELETE_MODULE'; payload: { id: string } }
  | { type: 'APPLY_AI_ACTIONS'; payload: AIAction[] }
  | { type: 'SET_ANIMATIONS'; payload: { connectionIds: string[] } }
  | { type: 'CLEAR_ANIMATIONS' }
  | { type: 'ADD_AGENTS_FROM_TEMPLATE'; payload: { moduleId: string; agents: Omit<Agent, 'id'>[] } }
  | { type: 'SELECT_CONNECTION'; payload: { id: string | null } }
  | { type: 'UPDATE_CONNECTION_LABEL'; payload: { id: string; label: string } }
  | { type: 'VIEW_TEAM_CANVAS'; payload: { id: string } }
  | { type: 'VIEW_MAIN_CANVAS' }
  | { type: 'ADD_INTERNAL_MODULE'; payload: { teamId: string; type: InternalModuleType; position: Point } }
  | { type: 'UPDATE_VIEWPORT'; payload: CanvasState['viewport'] }
  | { type: 'SET_AI_HIGHLIGHT'; payload: { moduleIds: string[] } }
  | { type: 'CLEAR_AI_HIGHLIGHT' }
  | { type: 'CLEAR_CANVAS' };


const initialState: CanvasState = {
  modules: {},
  connections: {},
  selectedModuleId: null,
  selectedConnectionId: null,
  newConnectionStart: null,
  animatedConnections: [],
  viewingTeamId: null,
  viewport: { scroll: {x: 0, y: 0}, size: {width: 800, height: 600}},
  aiHighlightModuleIds: [],
};

const canvasReducer = (state: CanvasState, action: Action): CanvasState => {
  switch (action.type) {
    case 'CLEAR_CANVAS':
        return {
            ...initialState,
            viewport: state.viewport // Keep viewport state
        }
    case 'ADD_MODULE': {
      const { module } = action.payload;
      if (module.type === ModuleType.MultiAgentTeam) {
        module.internalCanvas = { modules: {}, connections: {} };
      }
      return {
        ...state,
        modules: {
          ...state.modules,
          [module.id]: module,
        },
        selectedModuleId: module.id,
        selectedConnectionId: null,
      };
    }
    case 'ADD_INTERNAL_MODULE': {
      const { teamId, type, position } = action.payload;
      const teamModule = state.modules[teamId];
      if (!teamModule || !teamModule.internalCanvas) return state;

      const id = uuidv4();
      const newInternalModule: InternalModule = {
        id,
        type,
        name: TEAM_CANVAS_MODULE_DEFINITIONS[type].defaultName,
        position,
      };
      
      const updatedInternalCanvas: InternalCanvas = {
        ...teamModule.internalCanvas,
        modules: {
          ...teamModule.internalCanvas.modules,
          [id]: newInternalModule
        }
      };

      const updatedTeamModule: Module = {
        ...teamModule,
        internalCanvas: updatedInternalCanvas
      };

      return {
        ...state,
        modules: {
          ...state.modules,
          [teamId]: updatedTeamModule,
        },
      };
    }
    case 'MOVE_MODULE': {
        const { id, position } = action.payload;
        if (state.viewingTeamId) {
            const teamModule = state.modules[state.viewingTeamId];
            if (teamModule && teamModule.internalCanvas) {
                const internalModule = teamModule.internalCanvas.modules[id];
                if (internalModule) {
                    const updatedInternalModule = { ...internalModule, position };
                    const updatedInternalCanvas = {
                        ...teamModule.internalCanvas,
                        modules: { ...teamModule.internalCanvas.modules, [id]: updatedInternalModule }
                    };
                    const updatedTeamModule = { ...teamModule, internalCanvas: updatedInternalCanvas };
                    return {
                        ...state,
                        modules: { ...state.modules, [state.viewingTeamId]: updatedTeamModule }
                    };
                }
            }
            return state;
        }

        const moduleToMove = state.modules[id];
        if (!moduleToMove) return state;
        return {
            ...state,
            modules: { ...state.modules, [id]: { ...moduleToMove, position } },
        };
    }
    case 'SELECT_MODULE':
      return { ...state, selectedModuleId: action.payload.id, selectedConnectionId: null, animatedConnections: [] };
    case 'SELECT_CONNECTION':
        return { ...state, selectedConnectionId: action.payload.id, selectedModuleId: null, animatedConnections: [] };
    case 'UPDATE_MODULE_CONFIG': {
        const { id, name, config, agents } = action.payload;
        const moduleToUpdate = state.modules[id];
        if (!moduleToUpdate) return state;

        const updatedModule = { ...moduleToUpdate, name };
        if (config) updatedModule.config = config;
        
        if (agents && moduleToUpdate.type === ModuleType.MultiAgentTeam) {
            updatedModule.agents = agents;
            
            const existingInternalNodesByAgentId = Object.values(moduleToUpdate.internalCanvas?.modules || {})
              .filter(m => m.agentId)
              .reduce((acc, m) => {
                acc[m.agentId!] = m;
                return acc;
              }, {} as Record<string, InternalModule>);

            const syncedInternalModules = { ...moduleToUpdate.internalCanvas!.modules };
            
            (agents as Agent[]).forEach(agent => {
                const existingNode = existingInternalNodesByAgentId[agent.id];
                if (existingNode) {
                    syncedInternalModules[existingNode.id] = { ...existingNode, name: agent.name };
                } else {
                    const newInternalId = uuidv4();
                    syncedInternalModules[newInternalId] = {
                        id: newInternalId,
                        agentId: agent.id,
                        name: agent.name,
                        type: InternalModuleType.AgentNode,
                        position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 }
                    };
                }
            });

            const agentIds = new Set((agents as Agent[]).map(a => a.id));
            Object.values(syncedInternalModules).forEach(m => {
              if(m.type === InternalModuleType.AgentNode && m.agentId && !agentIds.has(m.agentId)) {
                delete syncedInternalModules[m.id];
              }
            });

            updatedModule.internalCanvas = {
                ...moduleToUpdate.internalCanvas!,
                modules: syncedInternalModules
            };
        }

        return {
            ...state,
            modules: { ...state.modules, [id]: updatedModule },
        };
    }
    case 'UPDATE_CONNECTION_LABEL': {
        const { id, label } = action.payload;
        const connToUpdate = state.connections[id];
        if (!connToUpdate) return state;
        return {
            ...state,
            connections: { ...state.connections, [id]: { ...connToUpdate, label } }
        }
    }
    case 'DELETE_MODULE': {
        const { id } = action.payload;
        const newModules = { ...state.modules };
        delete newModules[id];

        const newConnections = { ...state.connections };
        let newSelectedConnectionId = state.selectedConnectionId;
        Object.values(newConnections).forEach(conn => {
            if (conn.fromModuleId === id || conn.toModuleId === id) {
                if (conn.id === newSelectedConnectionId) {
                    newSelectedConnectionId = null;
                }
                delete newConnections[conn.id];
            }
        });

        return {
            ...state,
            modules: newModules,
            connections: newConnections,
            selectedModuleId: state.selectedModuleId === id ? null : state.selectedModuleId,
            selectedConnectionId: newSelectedConnectionId,
        };
    }
    case 'START_CONNECTION':
      return { ...state, newConnectionStart: action.payload };
    case 'END_CONNECTION': {
      if (!state.newConnectionStart) return state;
      const { toModuleId } = action.payload;
      const fromModuleId = state.newConnectionStart.moduleId;
      if (fromModuleId === toModuleId) {
          return { ...state, newConnectionStart: null };
      }
      const newId = `conn-${uuidv4()}`;

      if (state.viewingTeamId) {
          const teamModule = state.modules[state.viewingTeamId];
          if(teamModule && teamModule.internalCanvas) {
              const newInternalConnection = { id: newId, fromModuleId, toModuleId };
              const updatedInternalCanvas = {
                  ...teamModule.internalCanvas,
                  connections: { ...teamModule.internalCanvas.connections, [newId]: newInternalConnection }
              };
              const updatedTeamModule = { ...teamModule, internalCanvas: updatedInternalCanvas };
              return {
                  ...state,
                  modules: { ...state.modules, [state.viewingTeamId]: updatedTeamModule },
                  newConnectionStart: null,
              };
          }
      }
      
      const newConnection = {
        id: newId,
        fromModuleId,
        toModuleId,
        label: 'Data',
      };
      return {
        ...state,
        connections: { ...state.connections, [newId]: newConnection },
        newConnectionStart: null,
      };
    }
    case 'CANCEL_CONNECTION':
      return { ...state, newConnectionStart: null };
    case 'LOAD_STATE':
        return {
            ...initialState,
            modules: action.payload.modules || {},
            connections: action.payload.connections || {},
        }
    case 'APPLY_AI_ACTIONS': {
        let newModules = { ...state.modules };
        let newConnections = { ...state.connections };
        const addedModuleNames: Record<string, string> = {}; // Maps temp name to new ID
        const addedModuleIds: string[] = [];

        for (const aiAction of action.payload) {
            if (aiAction.action === 'ADD_MODULE') {
                const id = uuidv4();
                addedModuleIds.push(id);
                // Use provided position or fallback to viewport center
                const position = aiAction.position || { 
                    x: state.viewport.scroll.x + state.viewport.size.width / 2 - 144, // 144 is half module width
                    y: state.viewport.scroll.y + state.viewport.size.height / 2 - 40, // 40 is half module height
                };
                
                let parsedStatus = {};
                if (typeof aiAction.status === 'string') {
                    try {
                        parsedStatus = JSON.parse(aiAction.status);
                    } catch (e) {
                        console.warn('Could not parse status string from AI:', aiAction.status);
                    }
                } else if (typeof aiAction.status === 'object' && aiAction.status !== null) {
                    parsedStatus = aiAction.status;
                }

                const newModule: Module = {
                    id,
                    type: aiAction.moduleType,
                    name: aiAction.name,
                    position,
                    status: parsedStatus,
                    ...(aiAction.moduleType === ModuleType.MultiAgentTeam && { 
                        agents: [],
                        internalCanvas: { modules: {}, connections: {} }
                    }),
                };
                newModules[id] = newModule;
                addedModuleNames[aiAction.name] = id;
            }
        }
        
        for (const aiAction of action.payload) {
            if (aiAction.action === 'ADD_CONNECTION') {
                const findModuleId = (name: string) => {
                    if (addedModuleNames[name]) return addedModuleNames[name];
                    const existingModule = Object.values(newModules).find(m => m.name === name);
                    return existingModule?.id;
                };

                const fromModuleId = findModuleId(aiAction.fromModuleName);
                const toModuleId = findModuleId(aiAction.toModuleName);

                if (fromModuleId && toModuleId) {
                    const newId = `conn-${uuidv4()}`;
                    const newConnection: Connection = {
                        id: newId,
                        fromModuleId,
                        toModuleId,
                        label: 'Data',
                    };
                    newConnections[newId] = newConnection;
                } else {
                    console.warn(`Could not create connection: Start module "${aiAction.fromModuleName}" or end module "${aiAction.toModuleName}" not found.`);
                }
            }
        }
        return { ...state, modules: newModules, connections: newConnections, aiHighlightModuleIds: addedModuleIds };
    }
     case 'ADD_AGENTS_FROM_TEMPLATE': {
        const { moduleId, agents: agentsToAdd } = action.payload;
        const moduleToUpdate = state.modules[moduleId];
        if (!moduleToUpdate || moduleToUpdate.type !== ModuleType.MultiAgentTeam) return state;

        const newAgents = agentsToAdd.map(agent => ({
            ...agent,
            id: uuidv4()
        }));
        
        const existingAgents = moduleToUpdate.agents || [];
        const updatedAgents = [...existingAgents, ...newAgents];

        const newInternalModules: Record<string, InternalModule> = { ...moduleToUpdate.internalCanvas?.modules };
        newAgents.forEach(agent => {
            const newInternalId = uuidv4();
            newInternalModules[newInternalId] = {
                id: newInternalId,
                agentId: agent.id,
                name: agent.name,
                type: InternalModuleType.AgentNode,
                position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 }
            }
        });
        
        const updatedModule = {
            ...moduleToUpdate,
            agents: updatedAgents,
            internalCanvas: { ...moduleToUpdate.internalCanvas!, modules: newInternalModules },
        };

        return {
            ...state,
            modules: { ...state.modules, [moduleId]: updatedModule }
        };
    }
    case 'VIEW_TEAM_CANVAS':
      return { ...state, viewingTeamId: action.payload.id, selectedModuleId: null, selectedConnectionId: null };
    case 'VIEW_MAIN_CANVAS':
      return { ...state, viewingTeamId: null, selectedModuleId: null, selectedConnectionId: null };
    case 'SET_ANIMATIONS':
        return { ...state, animatedConnections: action.payload.connectionIds };
    case 'CLEAR_ANIMATIONS':
        return { ...state, animatedConnections: [] };
    case 'UPDATE_VIEWPORT':
        return { ...state, viewport: action.payload };
    case 'SET_AI_HIGHLIGHT':
        return { ...state, aiHighlightModuleIds: action.payload.moduleIds };
    case 'CLEAR_AI_HIGHLIGHT':
        return { ...state, aiHighlightModuleIds: [] };
    default:
      return state;
  }
};

export const CanvasContext = createContext<{ state: CanvasState; dispatch: Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  // Auto-clear AI highlights
  useEffect(() => {
    if (state.aiHighlightModuleIds.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_AI_HIGHLIGHT' });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [state.aiHighlightModuleIds]);


  return <CanvasContext.Provider value={{ state, dispatch }}>{children}</CanvasContext.Provider>;
};