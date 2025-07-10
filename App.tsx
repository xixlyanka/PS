import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Message, MessageAuthor, Panel, AgentState, RoleModels, OllamaModel, Attachment, OllamaRole, PywebviewApi } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ThreeDBackground } from './components/ThreeDBackground';
import { PanelToggle } from './components/PanelToggle';
import { CodePanel } from './components/CodePanel';
import { LogsPanel } from './components/LogsPanel';
import { ProjectBoardPanel } from './components/ProjectBoardPanel';
import { CanvasPanel } from './components/CanvasPanel';

// Объявляем правильный тип для window.pywebview
declare global {
  interface Window {
    pywebview: {
      api: PywebviewApi;
    };
    initialize: (models: OllamaModel[], defaultModels: RoleModels) => void;
    addAgentMessage: (content: string, attachments?: Attachment[]) => void;
    updateAgentState: (state: Partial<AgentState>) => void;
    addSystemMessage: (content: string) => void;
    addLogMessage: (logEntry: any) => void;
    updateModelPullProgress: (progress: string) => void;
    refreshOllamaModels: (models: OllamaModel[]) => void;
  }
}

// Вспомогательная функция для конвертации файла в base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

const App: React.FC = () => {
  const api = window.pywebview?.api;

  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activePanels, setActivePanels] = useState<Set<Panel>>(new Set([Panel.SIDEBAR]));
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentState, setAgentState] = useState<AgentState>({ isThinking: false, isTyping: false });
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [modelPullProgress, setModelPullProgress] = useState<string>('');
  const [roleModels, setRoleModels] = useState<RoleModels>({
    [OllamaRole.ORCHESTRATOR]: '',
    [OllamaRole.SPEAKER]: '',
    [OllamaRole.ANALYST]: '',
    [OllamaRole.CODER]: '',
  });

  const rightPanels = useMemo(() => [Panel.CODE, Panel.LOGS, Panel.CANVAS, Panel.PROJECT_BOARD], []);

  const addMessage = useCallback((author: MessageAuthor, content: string, attachments: Attachment[] = []) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      author,
      content,
      timestamp: new Date().toISOString(),
      attachments,
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // --- ИСПРАВЛЕНИЕ: Главный хук инициализации ---
  useEffect(() => {
    // 1. Определяем все функции, которые будет вызывать Python
    window.initialize = (models, defaultModels) => {
      setOllamaModels(models);
      setRoleModels(defaultModels);
      setIsBackendConnected(true);
      // Не добавляем сообщение здесь, чтобы избежать дублирования
    };
    window.addAgentMessage = (content, attachments) => {
      addMessage(MessageAuthor.AGENT, content, attachments);
      setAgentState({ isThinking: false, isTyping: false });
    };
    window.addSystemMessage = (content) => addMessage(MessageAuthor.SYSTEM, content);
    window.updateAgentState = (newState) => setAgentState(prev => ({ ...prev, ...newState }));
    window.updateModelPullProgress = (progress) => setModelPullProgress(progress);
    window.refreshOllamaModels = (models) => setOllamaModels(models);
    window.addLogMessage = (logEntry) => {
        // Можно выводить в консоль браузера для отладки
        console.log('LOG FROM PYTHON:', logEntry);
    };

    // 2. Сообщаем Python, что фронтенд полностью готов
    if (api && typeof api.jsReady === 'function') {
      api.jsReady();
    } else {
       console.error("pywebview API не найдено во время инициализации.");
    }
  }, [addMessage, api]); // Зависимости, чтобы хук выполнился при наличии api

  const handleSendMessage = useCallback(async (content: string, attachments: File[]) => {
    if (!isBackendConnected || !api) return;
    const attachmentData = attachments.map(f => ({ name: f.name, size: f.size, type: f.type }));
    addMessage(MessageAuthor.USER, content, attachmentData);
    setAgentState({ isThinking: true, isTyping: false });

    try {
      const formattedAttachments = await Promise.all(
        attachments.map(async (file) => ({
          name: file.name,
          type: file.type,
          content: await fileToBase64(file),
        }))
      );
      await api.sendMessage(content, formattedAttachments);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addMessage(MessageAuthor.SYSTEM, `Ошибка: ${errorMessage}`);
      setAgentState({ isThinking: false, isTyping: false });
    }
  }, [isBackendConnected, addMessage, api]);

  const handleModelChange = useCallback((role: OllamaRole, modelName: string) => {
    setRoleModels(prev => ({ ...prev, [role]: modelName }));
    api?.saveModelSelection(role, modelName);
  }, [api]);

  const togglePanel = useCallback((panel: Panel) => {
    setActivePanels(prev => {
      const newPanels = new Set(prev);
      const isRightPanel = rightPanels.includes(panel);
      const wasActive = newPanels.has(panel);
      if (isRightPanel) {
        rightPanels.forEach(p => newPanels.delete(p));
      }
      if (!wasActive) {
        newPanels.add(panel);
      } else if (!isRightPanel) {
        newPanels.delete(panel);
      }
      return newPanels;
    });
  }, [rightPanels]);

  const activeRightPanel = useMemo(() => rightPanels.find(p => activePanels.has(p)), [activePanels, rightPanels]);

  if (!isBackendConnected) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-bg-primary text-text-primary">
        Подключение к бэкенду...
      </div>
    );
  }

  return (
    <div id="root-container" className={`h-screen w-screen bg-bg-primary flex flex-col overflow-hidden ${theme}`}>
      <ThreeDBackground isThinking={agentState.isThinking} isTyping={agentState.isTyping} theme={theme} />
      <header className="flex-shrink-0 p-2 bg-bg-secondary/50 backdrop-blur-sm z-30 border-b border-border-primary/20 flex justify-center">
        <PanelToggle activePanels={activePanels} togglePanel={togglePanel} />
      </header>
      <div className="flex flex-grow min-h-0">
        <Sidebar
          isOpen={activePanels.has(Panel.SIDEBAR)}
          theme={theme}
          setTheme={setTheme}
          ollamaModels={ollamaModels}
          roleModels={roleModels}
          onModelChange={handleModelChange}
          onPullModel={(name) => api?.pullOllamaModel(name)}
          pullProgress={modelPullProgress}
        />
        <main className="flex-grow flex flex-col items-center justify-center transition-all duration-300 ease-in-out z-10 p-4 h-full min-w-0">
          <div className="w-full max-w-4xl h-full flex flex-col">
            <ChatWindow messages={messages} onSendMessage={handleSendMessage} agentState={agentState} />
          </div>
        </main>
        <CodePanel isOpen={activeRightPanel === Panel.CODE} />
        <LogsPanel isOpen={activeRightPanel === Panel.LOGS} />
        <ProjectBoardPanel isOpen={activeRightPanel === Panel.PROJECT_BOARD} />
        <CanvasPanel isOpen={activeRightPanel === Panel.CANVAS} />
      </div>
    </div>
  );
};

// --- ГЛАВНАЯ ЛОГИКА ЗАПУСКА ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Не найден корневой элемент #root для монтирования приложения");
}
const root = ReactDOM.createRoot(rootElement);

const renderApp = () => {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// --- ИСПРАВЛЕНИЕ: Убираем отсюда логику инициализации ---
window.addEventListener('pywebviewready', () => {
    renderApp();
});
