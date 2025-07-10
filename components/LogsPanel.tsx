import React, { useState, useEffect } from 'react';

interface LogEntry {
    timestamp: string;
    level: string;
    source: string;
    message: string;
}

export const LogsPanel: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    
    useEffect(() => {
        // Определяем глобальную функцию, которую будет вызывать Python
        window.addLogMessage = (logEntry) => {
            setLogs(prevLogs => [...prevLogs, logEntry].slice(-100)); // Храним последние 100 логов
        };
        // Начальное сообщение
        setLogs([{
            timestamp: new Date().toISOString(),
            level: 'INFO',
            source: 'System',
            message: 'Log panel initialized. Waiting for backend messages.'
        }]);
    }, []);

    const levelColors: {[key: string]: string} = {
        INFO: 'text-blue-400',
        DEBUG: 'text-gray-400',
        WARNING: 'text-yellow-400',
        ERROR: 'text-red-400',
    };

  return (
    <aside className={`flex-shrink-0 bg-bg-secondary/80 backdrop-blur-md border-l border-border-primary/20 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-20 ${isOpen ? 'w-[550px]' : 'w-0'}`}>
        <div className="w-[550px] h-full flex flex-col">
            <div className="p-4 border-b border-border-primary flex-shrink-0">
                <h2 className="text-xl font-bold text-text-primary">System Logs</h2>
            </div>
            <div className="flex-grow p-4 overflow-y-auto scrollbar-thin font-mono text-xs">
                {logs.map((log, index) => (
                    <div key={index} className="flex mb-2">
                        <span className="text-text-secondary mr-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`font-bold w-20 flex-shrink-0 ${levelColors[log.level] || 'text-text-primary'}`}>{`[${log.level}]`}</span>
                        <span className="text-green-400 mr-2">{`[${log.source}]`}</span>
                        <span className="text-text-primary break-all whitespace-pre-wrap">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    </aside>
  );
};