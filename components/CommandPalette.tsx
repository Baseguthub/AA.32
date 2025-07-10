
import React, { useState, useContext, useEffect, useRef } from 'react';
import { MODULE_CATEGORIES, ALL_MODULE_DEFINITIONS } from '../constants';
import { ModuleType } from '../types';
import { CanvasContext } from '../context/CanvasContext';
import { v4 as uuidv4 } from 'uuid';
import { CornerDownLeft, Wand, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import * as geminiService from '../services/geminiService';
import { useToast } from '../context/ToastContext';
import { useUI } from '../context/UIContext';
import { useAssistant } from '../context/AssistantContext';


interface Command {
    id: string;
    type: 'module' | 'action';
    name: string;
    category: string;
    icon: React.ReactNode | string;
    action: () => void;
}

const DynamicIcon: React.FC<Icons.LucideProps & { name: string }> = ({ name, ...props }) => {
    const IconComponent = (Icons as any)[name] || HelpCircle;
    return <IconComponent {...props} />;
};

interface CommandPaletteProps {
    onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
    const { state, dispatch } = useContext(CanvasContext);
    const { addToast } = useToast();
    const { setRightPanelTab } = useUI();
    const { addMessage, setIsLoading, showError } = useAssistant();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const { modules, connections, viewport } = state;
    
    const commands: Command[] = [
        ...MODULE_CATEGORIES.flatMap(cat => 
            cat.modules.map(mod => ({
                id: mod.type,
                type: 'module' as const,
                name: mod.type,
                category: cat.name,
                icon: mod.icon,
                action: () => {
                     const newModule = {
                        id: uuidv4(),
                        type: mod.type as ModuleType,
                        name: ALL_MODULE_DEFINITIONS[mod.type].defaultName,
                        position: { 
                            x: viewport.scroll.x + viewport.size.width / 2 - 144, // 144 is half of module width 288
                            y: viewport.scroll.y + viewport.size.height / 2 - 40, // 40 is half of module height 80
                        },
                        status: {},
                        ...(mod.type === ModuleType.MultiAgentTeam && { agents: [] }),
                    };
                    dispatch({ type: 'ADD_MODULE', payload: { module: newModule } });
                    addToast(`Added "${newModule.name}"`, 'success');
                }
            }))
        ),
        {
            id: 'analyze-design',
            type: 'action' as const,
            name: 'Analyze Design',
            category: 'AI Assistant',
            icon: 'Wand',
            action: async () => {
                onClose(); // Close palette immediately for better feedback
                setRightPanelTab('assistant');
                addMessage({ sender: 'user', text: "Analyze my current design." });
                setIsLoading(true);
                 try {
                    const responseText = await geminiService.analyzeDesign(modules, connections);
                    addMessage({ sender: 'ai', text: responseText });
                 } catch (error) {
                    console.error("Analysis failed", error);
                    showError("Sorry, I encountered an error during analysis. Please try again.");
                 } finally {
                    setIsLoading(false);
                 }
            }
        }
    ];

    const filteredCommands = searchTerm
        ? commands.filter(cmd => cmd.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : commands;
        
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
            }
        }
    };

    const handleSelect = (command: Command) => {
        command.action();
    }
    
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 command-palette-overlay" onClick={onClose}>
            <div 
                className="w-full max-w-2xl bg-sidebar-bg rounded-xl shadow-2xl overflow-hidden glass-pane"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a command or search for a module..."
                    className="w-full p-4 bg-transparent text-lg text-text-primary outline-none border-b border-border-color"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <div className="max-h-[60vh] overflow-y-auto">
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((cmd, index) => {
                           const iconNode = typeof cmd.icon === 'string'
                                ? <DynamicIcon name={cmd.icon} size={20} />
                                : cmd.icon;
                           
                           return (
                               <div 
                                    key={cmd.id} 
                                    onClick={() => handleSelect(filteredCommands[index])}
                                    className={`flex items-center justify-between p-4 cursor-pointer ${selectedIndex === index ? 'bg-accent text-white' : 'hover:bg-panel-bg'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`${selectedIndex === index ? 'text-white' : 'text-text-secondary'}`}>{iconNode}</div>
                                        <div>
                                            <p className="font-semibold">{cmd.name}</p>
                                            <p className={`text-xs ${selectedIndex === index ? 'text-sky-200' : 'text-text-secondary'}`}>{cmd.category}</p>
                                        </div>
                                    </div>
                                    {selectedIndex === index && <CornerDownLeft size={16} />}
                               </div>
                           );
                        })
                    ) : (
                        <p className="p-4 text-text-secondary">No results found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;