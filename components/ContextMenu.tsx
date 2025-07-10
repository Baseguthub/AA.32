
import React from 'react';
import { ContextMenuState } from '../types';

interface ContextMenuProps extends ContextMenuState {
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, position, items, onClose }) => {
    if (!visible) {
        return null;
    }

    const handleItemClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        onClose();
    };

    return (
        <div
            style={{ top: position.y, left: position.x }}
            className="fixed z-50 w-56 p-2 rounded-lg shadow-2xl bg-sidebar-bg glass-pane border border-border-color"
            onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up to the window listener
        >
            <ul className="space-y-1">
                {items.map((item, index) => (
                    <li key={index}>
                        <button
                            onClick={(e) => handleItemClick(e, item.action)}
                            className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-md text-text-primary hover:bg-accent hover:text-white transition-colors"
                        >
                            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                            <span className="flex-grow">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ContextMenu;
