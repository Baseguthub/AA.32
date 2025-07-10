import React, { useContext, useState, useEffect } from 'react';
import { CanvasContext } from '../context/CanvasContext';
import { ModuleType, Agent } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Trash2, PlayCircle, Link, Info, LayoutGrid } from 'lucide-react';
import { AGENT_TEAM_TEMPLATES } from '../constants';
import { useToast } from '../context/ToastContext';

const ConfigPanel: React.FC = () => {
  const { state, dispatch } = useContext(CanvasContext);
  const { selectedModuleId, selectedConnectionId, modules, connections } = state;
  const { addToast } = useToast();
  
  const selectedModule = selectedModuleId ? modules[selectedModuleId] : null;
  const selectedConnection = selectedConnectionId ? connections[selectedConnectionId] : null;

  const [moduleName, setModuleName] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [connectionLabel, setConnectionLabel] = useState('');

  useEffect(() => {
    if (selectedModule) {
      setModuleName(selectedModule.name);
      if (selectedModule.type === ModuleType.MultiAgentTeam) {
        setAgents(selectedModule.agents || []);
      }
    }
  }, [selectedModuleId, modules]);
  
  useEffect(() => {
    if(selectedConnection) {
        setConnectionLabel(selectedConnection.label || '');
    }
  }, [selectedConnectionId, connections]);

  const handleModuleBlur = () => {
      if (selectedModule && (moduleName !== selectedModule.name || JSON.stringify(agents) !== JSON.stringify(selectedModule.agents || []))) {
          dispatch({ type: 'UPDATE_MODULE_CONFIG', payload: { id: selectedModule.id, name: moduleName, agents } });
          addToast(`Updated "${moduleName}"`, 'info');
      }
  };

  const handleConnectionBlur = () => {
      if(selectedConnection && connectionLabel !== selectedConnection.label) {
        dispatch({type: 'UPDATE_CONNECTION_LABEL', payload: { id: selectedConnection.id, label: connectionLabel }})
        addToast(`Updated connection label`, 'info');
      }
  }

  const handleAgentChange = (index: number, field: keyof Omit<Agent, 'id'>, value: string) => {
    const newAgents = [...agents];
    newAgents[index] = { ...newAgents[index], [field]: value };
    setAgents(newAgents);
  };

  const addAgent = () => setAgents([...agents, { id: uuidv4(), name: 'New Agent', role: 'Worker', description: '' }]);
  const removeAgent = (index: number) => {
      const agentName = agents[index].name;
      const newAgents = agents.filter((_, i) => i !== index);
      setAgents(newAgents);
       if (selectedModule) {
          dispatch({ type: 'UPDATE_MODULE_CONFIG', payload: { id: selectedModule.id, name: moduleName, agents: newAgents } });
          addToast(`Removed agent: ${agentName}`, 'info');
      }
  }

  const handleAddAgentsFromTemplate = (templateAgents: Omit<Agent, 'id'>[]) => {
    if (!selectedModuleId) return;
    dispatch({type: 'ADD_AGENTS_FROM_TEMPLATE', payload: { moduleId: selectedModuleId, agents: templateAgents }});
    addToast('Added agents from template.', 'success');
  }

  const handleSimulateFlow = () => {
    if (!selectedModuleId || !selectedModule) return;
    const outgoingConnectionIds = Object.values(connections)
        .filter(conn => conn.fromModuleId === selectedModuleId)
        .map(conn => conn.id);

    if (outgoingConnectionIds.length > 0) {
        dispatch({ type: 'SET_ANIMATIONS', payload: { connectionIds: outgoingConnectionIds } });
        addToast(`Simulating flow from "${selectedModule.name}"...`, 'info');
        setTimeout(() => dispatch({ type: 'CLEAR_ANIMATIONS' }), 3000);
    } else {
        addToast('No outgoing connections to simulate.', 'warning');
    }
  };

  if (!selectedModule && !selectedConnection) {
    return (
      <div className="p-6 text-text-secondary text-center h-full flex flex-col items-center justify-center gap-4">
        <LayoutGrid size={48} className="text-border-color" />
        <div className='flex flex-col gap-1'>
            <p className="text-lg font-semibold text-text-primary">Nothing Selected</p>
            <p className="text-sm">Click a module or connection on the canvas to see its properties here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {selectedModule && (
        <>
          <div>
            <label htmlFor="module-name" className="block text-sm font-medium text-text-secondary mb-1">Module Name</label>
            <input
              type="text" id="module-name" value={moduleName}
              onChange={e => setModuleName(e.target.value)}
              onBlur={handleModuleBlur}
              className="w-full bg-canvas-bg border border-border-color rounded-md px-3 py-2 text-text-primary focus:ring-accent focus:border-accent"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">Module Type</p>
            <p className="text-text-primary">{selectedModule.type}</p>
          </div>
          <div className="border-t border-border-color pt-4">
            <button onClick={handleSimulateFlow} className="w-full flex items-center justify-center gap-2 py-2 text-accent hover:bg-panel-bg rounded-md transition-colors border border-accent">
                <PlayCircle size={16}/> Simulate Flow
            </button>
          </div>
          {selectedModule.type === ModuleType.MultiAgentTeam && (
            <div className="space-y-4 border-t border-border-color pt-4">
                <div className="p-3 bg-accent/20 text-sky-300 border border-accent/30 rounded-lg flex items-start gap-3 text-sm">
                    <Info size={24} className="shrink-0 mt-0.5 text-accent" />
                    <p>Double-click the team module on the canvas to open the **Team Canvas** and visually architect its internal workflow.</p>
                </div>

                <h3 className="text-md font-semibold text-text-primary">Configure Agents</h3>
                {agents.map((agent, index) => (
                    <div key={agent.id} className="p-3 bg-canvas-bg rounded-md border border-border-color space-y-2 relative group">
                         <button onClick={() => removeAgent(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                        <div>
                            <label className="text-xs text-text-secondary">Agent Name</label>
                            <input type="text" value={agent.name} onChange={e => handleAgentChange(index, 'name', e.target.value)} onBlur={handleModuleBlur} className="w-full bg-sidebar-bg border-none rounded px-2 py-1 text-sm"/>
                        </div>
                         <div>
                            <label className="text-xs text-text-secondary">Agent Role</label>
                            <input type="text" value={agent.role} onChange={e => handleAgentChange(index, 'role', e.target.value)} onBlur={handleModuleBlur} className="w-full bg-sidebar-bg border-none rounded px-2 py-1 text-sm"/>
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary">Agent Description</label>
                            <textarea value={agent.description} onChange={e => handleAgentChange(index, 'description', e.target.value)} onBlur={handleModuleBlur} className="w-full bg-sidebar-bg border-none rounded px-2 py-1 text-sm resize-none" rows={2}/>
                        </div>
                    </div>
                ))}
                <button onClick={addAgent} onBlur={handleModuleBlur} className="w-full flex items-center justify-center gap-2 py-2 text-accent hover:bg-panel-bg rounded-md transition-colors"><PlusCircle size={16}/>Add Agent</button>
                <div className="space-y-2 pt-4 border-t border-border-color">
                    <h4 className="text-sm font-semibold text-text-secondary">Load Team Template</h4>
                    {AGENT_TEAM_TEMPLATES.map(template => (
                        <button key={template.name} onClick={() => handleAddAgentsFromTemplate(template.agents)} className="w-full text-left text-sm p-2 bg-canvas-bg rounded-md hover:bg-accent hover:text-white transition-colors"> + {template.name} </button>
                    ))}
                </div>
            </div>
          )}
        </>
      )}

      {selectedConnection && (
         <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2"><Link size={18}/> Connection</h3>
            <div>
              <label htmlFor="connection-label" className="block text-sm font-medium text-text-secondary mb-1">Flow Label</label>
              <input
                type="text" id="connection-label" value={connectionLabel}
                onChange={e => setConnectionLabel(e.target.value)}
                onBlur={handleConnectionBlur}
                className="w-full bg-canvas-bg border border-border-color rounded-md px-3 py-2 text-text-primary focus:ring-accent focus:border-accent"
              />
            </div>
             <div>
                <p className="text-sm font-medium text-text-secondary">From</p>
                <p className="text-text-primary bg-canvas-bg p-2 rounded-md">{modules[selectedConnection.fromModuleId]?.name || 'N/A'}</p>
             </div>
             <div>
                <p className="text-sm font-medium text-text-secondary">To</p>
                <p className="text-text-primary bg-canvas-bg p-2 rounded-md">{modules[selectedConnection.toModuleId]?.name || 'N/A'}</p>
             </div>
         </div>
      )}
    </div>
  );
};

export default ConfigPanel;