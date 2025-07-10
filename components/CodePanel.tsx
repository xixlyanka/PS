import React, { useState, useEffect, useCallback } from 'react';
import { PywebviewApi } from '../types';

declare global {
  interface Window {
    pywebview: {
      api: PywebviewApi;
    };
  }
}

interface FileNode {
  name: string;
  type: 'folder' | 'file';
  path: string;
}

const FileTree: React.FC<{ onFileSelect: (path: string) => void; api: PywebviewApi }> = ({ onFileSelect, api }) => {
    const [tree, setTree] = useState<FileNode[]>([]);

    useEffect(() => {
        const fetchFiles = async () => {
            if (api && typeof api.listFiles === 'function') {
                try {
                    const rootFiles = await api.listFiles('.');
                    setTree(rootFiles);
                } catch (e) {
                    console.error("Failed to list files:", e);
                }
            }
        };
        fetchFiles();
    }, [api]);

    const renderNode = (node: FileNode) => (
        <div key={node.path} className="pl-2">
            <span 
              className="cursor-pointer hover:bg-bg-tertiary p-1 rounded flex items-center text-sm"
              onClick={() => node.type === 'file' && onFileSelect(node.path)}
            >
                <span className="mr-2">{node.type === 'folder' ? '📁' : '📄'}</span>
                <span>{node.name}</span>
            </span>
        </div>
    );

    return (
        <div className="p-2 text-text-secondary whitespace-nowrap">
            {tree.map(node => renderNode(node))}
        </div>
    );
};


export const CodePanel: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const api = window.pywebview?.api;
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');

  const handleFileSelect = useCallback((path: string) => {
      setActiveFile(path);
      if (api) {
        api.readFileContent(path).then(setCode);
      }
  }, [api]);
  
  const handleRunCode = async () => {
    if (activeFile && api) {
        setConsoleOutput(`> python ${activeFile}\nRunning...`);
        const result = await api.executeCode(code);
        let output = result.stdout;
        if(result.stderr) {
            output += `\n--- STDERR ---\n${result.stderr}`;
        }
        setConsoleOutput(`> python ${activeFile}\n${output}`);
    }
  };

  const handleSaveCode = async () => {
      if (activeFile && api) {
          const success = await api.writeFileContent(activeFile, code);
          setConsoleOutput(success ? `Saved ${activeFile}`: `Failed to save ${activeFile}`);
      }
  };

  if (!api) return null;

  return (
    <aside className={`flex-shrink-0 bg-bg-secondary/80 backdrop-blur-md border-l border-border-primary/20 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-20 ${isOpen ? 'w-[550px]' : 'w-0'}`}>
        <div className="w-[550px] h-full flex flex-col">
            <div className="p-4 border-b border-border-primary flex-shrink-0">
                <h2 className="text-xl font-bold text-text-primary">Code IDE</h2>
            </div>
            <div className="flex-shrink-0 h-1/3 overflow-y-auto scrollbar-thin border-b border-border-primary">
                <h3 className="p-2 text-sm font-semibold bg-bg-tertiary text-text-primary sticky top-0 z-10">File Explorer</h3>
                <FileTree onFileSelect={handleFileSelect} api={api} />
            </div>
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex items-center justify-between p-2 border-b border-border-primary bg-bg-tertiary">
                    <span className="text-sm font-semibold text-text-primary">{activeFile || 'No file selected'}</span>
                    <div className="flex space-x-2">
                        <button onClick={handleSaveCode} disabled={!activeFile} className="text-xs bg-accent text-bg-primary font-semibold py-1 px-3 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50">Save</button>
                        <button onClick={handleRunCode} disabled={!activeFile} className="text-xs bg-bg-primary text-text-primary font-semibold py-1 px-3 rounded-md hover:bg-accent hover:text-bg-primary transition-colors disabled:opacity-50">Run</button>
                    </div>
                </div>
                <textarea
                  className="w-full h-full p-2 bg-bg-primary text-text-primary font-mono text-sm resize-none focus:outline-none scrollbar-thin"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={!activeFile}
                />
            </div>
            <div className="flex-shrink-0 h-1/4 border-t border-border-primary flex flex-col">
                <h3 className="p-2 text-sm font-semibold bg-bg-tertiary text-text-primary">Console</h3>
                <div className="p-2 bg-bg-primary flex-grow overflow-y-auto scrollbar-thin font-mono text-xs text-text-secondary whitespace-pre-wrap">
                  {consoleOutput}
                </div>
            </div>
        </div>
    </aside>
  );
};
