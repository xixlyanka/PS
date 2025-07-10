export interface Attachment {
  name: string;
  size: number;
  type: string;
}

export enum MessageAuthor {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  author: MessageAuthor;
  content: string;
  timestamp: string;
  feedback?: 'good' | 'bad';
  attachments?: Attachment[];
}

export enum Panel {
  SIDEBAR = 'sidebar',
  CODE = 'code',
  LOGS = 'logs',
  CANVAS = 'canvas',
  PROJECT_BOARD = 'project-board',
}

export interface AgentState {
  isThinking: boolean;
  isTyping: boolean;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export enum OllamaRole {
  ORCHESTRATOR = 'ORCHESTRATOR_MODEL',
  SPEAKER = 'SPEAKER_MODEL',
  ANALYST = 'ANALYST_MODEL',
  CODER = 'CODER_MODEL',
}

export type RoleModels = {
  [key in OllamaRole]: string;
};

interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

// Единый, правильный интерфейс для API Python
export interface PywebviewApi {
  // Сигнал о готовности фронтенда
  jsReady: () => void;

  // Сообщения
  sendMessage: (message: string, attachments: {name: string; content: string; type: string}[]) => Promise<void>;
  
  // Управление моделями
  pullOllamaModel: (modelName: string) => Promise<void>;
  saveModelSelection: (role: OllamaRole, modelName: string) => Promise<void>;

  // Файловая система
  listFiles: (path: string) => Promise<any[]>;
  readFileContent: (path: string) => Promise<string>;
  writeFileContent: (path: string, content: string) => Promise<boolean>;
  
  // Выполнение кода
  executeCode: (code: string) => Promise<{stdout: string; stderr: string; returncode: number}>;

  // Доска задач
  getTasks: () => Promise<any>;
}

// Единое, правильное объявление глобальных переменных и функций
declare global {
  interface Window {
    api: PywebviewApi;
    
    // Функции, вызываемые из Python для обновления UI
    initialize: (models: OllamaModel[], defaultModels: RoleModels) => void;
    addAgentMessage: (content: string, attachments?: Attachment[]) => void;
    updateAgentState: (state: Partial<AgentState>) => void;
    addSystemMessage: (content: string) => void;
    addLogMessage: (logEntry: LogEntry) => void;

    // Функции для управления моделями
    updateModelPullProgress: (progress: string) => void;
    refreshOllamaModels: (models: OllamaModel[]) => void;
  }
}