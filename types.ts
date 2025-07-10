
export enum ModuleType {
  // Core Components
  CoreTrustAgent = 'Central Orchestrator',
  MultiAgentTeam = 'Multi-agent Team',
  IndividualAgent = 'Individual Agent',

  // Memory
  ShortTermMemory = 'Short-term Memory',
  LongTermMemory = 'Long-term Memory',
  VectorDatabase = 'Vector Database',
  KnowledgeGraph = 'Knowledge Graph',
  Cache = 'Cache',

  // Data & I/O
  DataInput = 'Data Input',
  DataOutput = 'Data Output',
  APIEndpoint = 'API Endpoint',
  Webhook = 'Webhook',
  WebScraper = 'Web Scraper',
  FileProcessor = 'File Processor',

  // AI Models & Tools
  GenericLM = 'Language Model (Generic)',
  FineTunedLM = 'Language Model (Fine-Tuned)',
  ImageRecognition = 'Image Recognition',
  VideoAnalysis = 'Video Analysis',
  ImageGeneration = 'Image Generation',
  SpeechToText = 'Speech-to-Text',
  TextToSpeech = 'Text-to-Speech',
  SentimentAnalysis = 'Sentiment Analysis',
  GoogleSearch = 'Google Search Tool',
  CodeInterpreter = 'Code Interpreter',
  Calculator = 'Calculator Tool',
  
  // Processing & Logic
  DecisionMaker = 'Decision Maker',
  StrategicAdvisor = 'Strategic Advisor',
  TaskPlanner = 'Task Planner',
  ConditionalRouter = 'Conditional Router',
  Router = 'Router',
  Filter = 'Filter',
  
  // System & Security
  Security = 'Security & Privacy',
  UserAuthentication = 'User Authentication',
  Monitoring = 'Monitoring & Logging',
  FrontendInterface = 'Frontend Interface',

  // Human Interaction
  HumanInTheLoop = 'Human-in-the-Loop',
  FeedbackCollector = 'Feedback Collector',
  
  // Other
  GeminiAssistant = 'Gemini Assistant',
  ExternalTool = 'External Tool', // Generic fallback
}

// === Internal Team Canvas Types ===
export enum InternalModuleType {
  AgentNode = 'Agent Node',
  WorkflowLogic = 'Workflow Logic',
  InputGateway = 'Input Gateway',
  OutputGateway = 'Output Gateway',
}

export interface InternalModule {
  id: string;
  type: InternalModuleType;
  name: string;
  position: Point;
  agentId?: string; 
  config?: {
    workflowType?: 'Sequential' | 'Hierarchical' | 'Broadcast';
  };
}

export interface InternalConnection {
  id: string;
  fromModuleId: string;
  toModuleId: string;
}

export interface InternalCanvas {
  modules: Record<string, InternalModule>;
  connections: Record<string, InternalConnection>;
}
// ===================================


export interface Point {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: any;
}

export interface ContextMenuState {
  visible: boolean;
  position: Point;
  items: ContextMenuItem[];
}

export interface Agent {
  id:string;
  name: string;
  role: string;
  description: string;
}

export interface Module {
  id:string;
  type: ModuleType;
  name: string;
  position: Point;
  agents?: Agent[];
  status?: Record<string, string | number>;
  config?: Record<string, any>;
  internalCanvas?: InternalCanvas;
}

export interface Connection {
  id: string;
  fromModuleId: string;
  toModuleId: string;
  label?: string;
}

export enum ItemTypes {
  MODULE = 'module',
  INTERNAL_MODULE = 'internal_module',
}

// Types for AI Assistant actions
export interface AIAddModuleAction {
  action: 'ADD_MODULE';
  moduleType: ModuleType;
  name: string;
  position?: Point; // Position is now optional
  status?: Record<string, string | number> | string;
}

export interface AIAddConnectionAction {
  action: 'ADD_CONNECTION';
  fromModuleName: string;
  toModuleName: string;
}

export type AIAction = AIAddModuleAction | AIAddConnectionAction;

export interface AIActionsResponse {
  explanation: string;
  actions: AIAction[];
}

// Sidebar Module Information Types
export interface ModuleInfo {
    type: ModuleType | InternalModuleType;
    icon: string;
    color: string;
    defaultName: string;
}

export interface ModuleCategory {
    name: string;
    modules: ModuleInfo[];
}
