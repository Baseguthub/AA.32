
import React, { useState, useContext, useRef, useEffect } from 'react';
import { CanvasContext } from '../context/CanvasContext';
import * as geminiService from '../services/geminiService';
import { Send, Sparkles, Wand, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AIActionsResponse } from '../types';
import { useToast } from '../context/ToastContext';
import { useAssistant } from '../context/AssistantContext';

const GeminiAssistant: React.FC = () => {
  const { state, dispatch } = useContext(CanvasContext);
  const { addToast } = useToast();
  const { messages, isLoading, addMessage, setMessages, setIsLoading, showError } = useAssistant();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAiAvailable = geminiService.isGeminiAvailable();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  // Make the initial message context-aware
  useEffect(() => {
    if (messages.length === 1 && Object.keys(state.modules).length === 0 && isAiAvailable) {
       setMessages([{
           sender: 'ai',
           text: "Hello! Looks like you have a blank canvas. I'm your AI architecture assistant. \n\nTry asking me to get you started, for example: `Create a basic RAG setup`"
       }]);
    }
  }, [state.modules, messages.length, setMessages, isAiAvailable]);


  const handleSend = async () => {
    if (!input.trim() || isLoading || !isAiAvailable) return;
    const userMessage = { sender: 'user' as const, text: input };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response: AIActionsResponse = await geminiService.getAIResponse(input, state.modules, state.connections);
      const aiMessage = { sender: 'ai' as const, text: response.explanation };
      addMessage(aiMessage);
      
      if (response.actions && response.actions.length > 0) {
        dispatch({ type: 'APPLY_AI_ACTIONS', payload: response.actions });
        addToast('AI has updated the canvas.', 'success');
      }

    } catch (error) {
      console.error('Gemini Assistant error:', error);
      showError("Sorry, I encountered an error. Please check the console for details or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (isLoading || !isAiAvailable) return;
    const userMessage = { sender: 'user' as const, text: "Please analyze my current design and provide feedback." };
    addMessage(userMessage);
    setIsLoading(true);

    try {
        const responseText = await geminiService.analyzeDesign(state.modules, state.connections);
        const aiMessage = { sender: 'ai' as const, text: responseText };
        addMessage(aiMessage);
    } catch (error) {
        console.error('Gemini Analysis error:', error);
        showError("Sorry, I encountered an error during analysis. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  }

  return (
    <div className="p-4 h-full flex flex-col bg-panel-bg">
        {!isAiAvailable && (
             <div className="p-3 bg-red-900/50 text-red-300 border border-red-500/50 rounded-lg flex items-start gap-3 text-sm mb-4">
                <AlertTriangle size={32} className="shrink-0 mt-0.5 text-red-400" />
                <div>
                    <h3 className="font-bold text-red-200">AI Assistant Disabled</h3>
                    <p>A Gemini API key has not been configured for this application. Please ask the application owner to set the `API_KEY` environment variable.</p>
                </div>
            </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shrink-0 mt-1"><Sparkles size={18}/></div>}
                <div className={`prose prose-sm prose-invert max-w-full rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-accent text-white' : 'bg-sidebar-bg'}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
            </div>
            ))}
            {isLoading && (
                <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shrink-0 mt-1"><Sparkles size={18}/></div>
                     <div className="rounded-lg px-4 py-2 bg-sidebar-bg text-text-secondary">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                        </div>
                     </div>
                </div>
            )}
             <div ref={messagesEndRef} />
        </div>
        <div className="mt-4 pt-4 border-t border-border-color space-y-3">
             <button
                onClick={handleAnalyze}
                disabled={isLoading || Object.keys(state.modules).length < 2 || !isAiAvailable}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-fuchsia-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-fuchsia-700 transition-colors"
             >
                <Wand size={16}/>
                Analyze My Design
             </button>
            <div className="relative">
                <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAiAvailable ? "e.g., 'Create a basic RAG system'" : "AI is disabled."}
                disabled={isLoading || !isAiAvailable}
                className="w-full bg-sidebar-bg border border-border-color rounded-lg p-3 pr-12 resize-none focus:ring-accent focus:border-accent text-sm disabled:cursor-not-allowed"
                rows={2}
                />
                <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !isAiAvailable}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-accent text-white disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors"
                >
                <Send size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default GeminiAssistant;