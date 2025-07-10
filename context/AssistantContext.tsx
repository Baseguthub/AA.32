
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { useToast } from './ToastContext';

export interface Message {
  sender: 'user' | 'ai';
  text: string;
}

interface AssistantContextType {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setIsLoading: (loading: boolean) => void;
  showError: (errorMessage: string) => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I'm your AI architecture assistant. Ask me to build a system for you, or click 'Analyze My Design' to get feedback on your current canvas." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const showError = useCallback((errorMessage: string) => {
    const message: Message = { sender: 'ai', text: errorMessage };
    setMessages(prev => [...prev, message]);
    addToast(errorMessage, 'error');
  }, [addToast]);

  return (
    <AssistantContext.Provider value={{ messages, isLoading, addMessage, setMessages, setIsLoading, showError }}>
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = (): AssistantContextType => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};
