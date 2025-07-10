
import React, { createContext, useState, useContext, ReactNode } from 'react';

type RightPanelTab = 'config' | 'assistant';

interface UIContextType {
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;
  isCameraModalOpen: boolean;
  setCameraModalOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('assistant');
  const [isCameraModalOpen, setCameraModalOpen] = useState(false);


  return (
    <UIContext.Provider value={{ rightPanelTab, setRightPanelTab, isCameraModalOpen, setCameraModalOpen }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};