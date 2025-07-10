
import React from 'react';
import { ModuleType, Agent, InternalModuleType, ModuleInfo, ModuleCategory } from './types';

export const MODULE_CATEGORIES: ModuleCategory[] = [
    {
        name: 'Core Components',
        modules: [
            { type: ModuleType.CoreTrustAgent, icon: 'Cpu', color: 'bg-blue-600', defaultName: 'Orchestrator' },
            { type: ModuleType.MultiAgentTeam, icon: 'Users', color: 'bg-purple-600', defaultName: 'Agent Team' },
            { type: ModuleType.IndividualAgent, icon: 'Bot', color: 'bg-indigo-500', defaultName: 'Agent' },
        ]
    },
    {
        name: 'Memory',
        modules: [
            { type: ModuleType.ShortTermMemory, icon: 'MemoryStick', color: 'bg-teal-500', defaultName: 'Short-term Memory' },
            { type: ModuleType.LongTermMemory, icon: 'Database', color: 'bg-teal-700', defaultName: 'Long-term Memory' },
            { type: ModuleType.VectorDatabase, icon: 'DatabaseZap', color: 'bg-teal-600', defaultName: 'Vector DB' },
            { type: ModuleType.KnowledgeGraph, icon: 'Share2', color: 'bg-teal-800', defaultName: 'Knowledge Graph' },
            { type: ModuleType.Cache, icon: 'Pocket', color: 'bg-cyan-700', defaultName: 'Cache' },
        ]
    },
    {
        name: 'Data & I/O',
        modules: [
            { type: ModuleType.DataInput, icon: 'FileInput', color: 'bg-slate-500', defaultName: 'Data Input' },
            { type: ModuleType.DataOutput, icon: 'FileOutput', color: 'bg-slate-600', defaultName: 'Data Output' },
            { type: ModuleType.APIEndpoint, icon: 'PlugZap', color: 'bg-slate-700', defaultName: 'API Endpoint' },
            { type: ModuleType.Webhook, icon: 'Webhook', color: 'bg-slate-700', defaultName: 'Webhook' },
            { type: ModuleType.WebScraper, icon: 'Globe', color: 'bg-slate-400', defaultName: 'Web Scraper' },
            { type: ModuleType.FileProcessor, icon: 'FileCog', color: 'bg-slate-800', defaultName: 'File Processor' },
        ]
    },
    {
        name: 'AI Models & Tools',
        modules: [
            { type: ModuleType.GenericLM, icon: 'MessageCircle', color: 'bg-green-600', defaultName: 'Generic LLM' },
            { type: ModuleType.FineTunedLM, icon: 'MessageCirclePlus', color: 'bg-green-700', defaultName: 'Fine-Tuned LLM' },
            { type: ModuleType.ImageRecognition, icon: 'ScanEye', color: 'bg-lime-600', defaultName: 'Image Recognition' },
            { type: ModuleType.ImageGeneration, icon: 'ImageIcon', color: 'bg-lime-700', defaultName: 'Image Generation' },
            { type: ModuleType.VideoAnalysis, icon: 'Video', color: 'bg-lime-800', defaultName: 'Video Analysis' },
            { type: ModuleType.SpeechToText, icon: 'Mic', color: 'bg-emerald-500', defaultName: 'Speech-to-Text' },
            { type: ModuleType.TextToSpeech, icon: 'Volume2', color: 'bg-emerald-600', defaultName: 'Text-to-Speech' },
            { type: ModuleType.SentimentAnalysis, icon: 'Angry', color: 'bg-rose-600', defaultName: 'Sentiment Analysis' },
            { type: ModuleType.GoogleSearch, icon: 'Search', color: 'bg-amber-500', defaultName: 'Google Search' },
            { type: ModuleType.CodeInterpreter, icon: 'TerminalSquare', color: 'bg-amber-600', defaultName: 'Code Interpreter' },
            { type: ModuleType.Calculator, icon: 'Calculator', color: 'bg-amber-700', defaultName: 'Calculator' },
            { type: ModuleType.ExternalTool, icon: 'Puzzle', color: 'bg-orange-500', defaultName: 'External Tool' },
        ]
    },
    {
        name: 'Processing & Logic',
        modules: [
            { type: ModuleType.DecisionMaker, icon: 'BrainCircuit', color: 'bg-pink-600', defaultName: 'Decision Module' },
            { type: ModuleType.StrategicAdvisor, icon: 'Lightbulb', color: 'bg-yellow-500', defaultName: 'Strategy Advisor' },
            { type: ModuleType.TaskPlanner, icon: 'ListChecks', color: 'bg-pink-500', defaultName: 'Task Planner' },
            { type: ModuleType.ConditionalRouter, icon: 'Milestone', color: 'bg-pink-800', defaultName: 'Conditional Router' },
            { type: ModuleType.Router, icon: 'GitFork', color: 'bg-pink-700', defaultName: 'Router' },
            { type: ModuleType.Filter, icon: 'Filter', color: 'bg-rose-500', defaultName: 'Filter' },
        ]
    },
    {
        name: 'System & Security',
        modules: [
            { type: ModuleType.Security, icon: 'ShieldCheck', color: 'bg-red-600', defaultName: 'Security Module' },
            { type: ModuleType.UserAuthentication, icon: 'UserCheck', color: 'bg-red-700', defaultName: 'Authentication' },
            { type: ModuleType.Monitoring, icon: 'Activity', color: 'bg-orange-600', defaultName: 'Monitoring' },
            { type: ModuleType.FrontendInterface, icon: 'MonitorSmartphone', color: 'bg-cyan-500', defaultName: 'UI Interface' },
        ]
    },
    {
        name: 'Human Interaction',
        modules: [
            { type: ModuleType.HumanInTheLoop, icon: 'UserRoundCog', color: 'bg-sky-500', defaultName: 'Human-in-the-Loop' },
            { type: ModuleType.FeedbackCollector, icon: 'Star', color: 'bg-sky-600', defaultName: 'Feedback Collector' },
        ]
    },
    {
        name: 'Internal Tools',
        modules: [
            { type: ModuleType.GeminiAssistant, icon: 'MessageSquare', color: 'bg-fuchsia-500', defaultName: 'Gemini Helper' }
        ]
    }
];

// Flat map for easy lookup across the app
export const ALL_MODULE_DEFINITIONS: Record<string, Omit<ModuleInfo, 'type'>> = 
    MODULE_CATEGORIES.flatMap(category => category.modules).reduce((acc, module) => {
        acc[module.type] = {
            icon: module.icon,
            color: module.color,
            defaultName: module.defaultName
        };
        return acc;
    }, {} as Record<string, Omit<ModuleInfo, 'type'>>);
    
export const TEAM_CANVAS_MODULE_DEFINITIONS: Record<string, Omit<ModuleInfo, 'type'>> = {
    [InternalModuleType.AgentNode]: { icon: 'Bot', color: 'bg-indigo-500', defaultName: 'Agent' },
    [InternalModuleType.WorkflowLogic]: { icon: 'Workflow', color: 'bg-pink-500', defaultName: 'Workflow Logic' },
    [InternalModuleType.InputGateway]: { icon: 'LogIn', color: 'bg-slate-500', defaultName: 'Input' },
    [InternalModuleType.OutputGateway]: { icon: 'LogOut', color: 'bg-slate-600', defaultName: 'Output' },
};


export const AGENT_TEAM_TEMPLATES: { name: string; agents: Omit<Agent, 'id'>[] }[] = [
    {
        name: 'Research & Writing',
        agents: [
            { name: 'Researcher', role: 'Data Collector', description: 'Gathers information from various sources like web search and documents.' },
            { name: 'Analyst', role: 'Synthesizer', description: 'Analyzes the collected data, identifies key insights, and forms a thesis.' },
            { name: 'Writer', role: 'Content Creator', description: 'Writes the final report or content based on the analysis.' },
        ],
    },
    {
        name: 'Hierarchical Control',
        agents: [
            { name: 'Manager', role: 'Coordinator', description: 'Delegates tasks to worker agents and aggregates their results.' },
            { name: 'Worker A', role: 'Executor', description: 'Performs a specific, assigned sub-task.' },
            { name: 'Worker B', role: 'Executor', description: 'Performs another specific, assigned sub-task.' },
        ],
    },
];
