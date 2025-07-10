import React, { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes, ModuleInfo } from '../types';
import { MODULE_CATEGORIES } from '../constants';
import { ChevronRight, Search, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

interface SidebarItemProps {
  moduleInfo: ModuleInfo;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ moduleInfo }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.MODULE,
    item: { type: moduleInfo.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const dragRef = useRef<HTMLDivElement>(null);
  drag(dragRef);

  const IconComponent = (Icons as any)[moduleInfo.icon] || HelpCircle;

  return (
    <div
      ref={dragRef}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 border-transparent cursor-grab transition-all duration-200 ${isDragging ? 'opacity-50 bg-accent' : 'bg-panel-bg hover:border-accent'}`}
    >
      <div className={`${moduleInfo.color} p-2 rounded-md text-white`}>
        <IconComponent size={24} />
      </div>
      <span className="font-medium text-sm">{moduleInfo.type}</span>
    </div>
  );
};

const Sidebar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCategories = MODULE_CATEGORIES.map(category => {
        const filteredModules = category.modules.filter(module => 
            module.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { ...category, modules: filteredModules };
    }).filter(category => category.modules.length > 0);

  return (
    <aside className="w-72 bg-sidebar-bg p-2 flex flex-col gap-1 shrink-0 border-r border-border-color glass-pane">
        <div className="relative mb-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-canvas-bg/80 border border-border-color rounded-md pl-10 pr-4 py-2 text-text-primary focus:ring-accent focus:border-accent"
            />
        </div>
      <div className="overflow-y-auto flex-1 pr-1">
        {filteredCategories.map((category) => (
          <details key={category.name} className="group" open>
            <summary className="flex items-center justify-between p-2 rounded-md cursor-pointer list-none hover:bg-panel-bg">
              <span className="font-semibold text-text-secondary">{category.name}</span>
              <ChevronRight size={16} className="text-text-secondary transition-transform group-open:rotate-90" />
            </summary>
            <div className="pl-4 flex flex-col gap-2 py-2">
              {category.modules.map((moduleInfo) => (
                <SidebarItem key={moduleInfo.type} moduleInfo={moduleInfo} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;