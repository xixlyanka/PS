import React, { useState, useEffect } from 'react';
import { PywebviewApi } from '../types';

declare global {
  interface Window {
    pywebview: {
      api: PywebviewApi;
    };
  }
}

interface Task {
  id: number;
  title: string;
  status: string;
}

interface Tasks {
  todo: Task[];
  inprogress: Task[];
  done: Task[];
}

export const ProjectBoardPanel: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const api = window.pywebview?.api;
  const [tasks, setTasks] = useState<Tasks>({ todo: [], inprogress: [], done: [] });

  useEffect(() => {
    if (isOpen && api) {
      api.getTasks().then(setTasks);
    }
  }, [isOpen, api]);

  const renderColumn = (title: string, tasks: Task[]) => (
    <div className="flex-1 p-2">
      <h3 className="font-bold text-lg mb-4 text-text-primary">{title}</h3>
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-bg-tertiary p-3 rounded-md shadow">
            <p className="text-text-primary text-sm">{task.title}</p>
            <span className="text-xs text-text-secondary mt-1">{task.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <aside className={`flex-shrink-0 bg-bg-secondary/80 backdrop-blur-md border-l border-border-primary/20 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-20 ${isOpen ? 'w-[750px]' : 'w-0'}`}>
        <div className="w-[750px] h-full flex flex-col">
            <div className="p-4 border-b border-border-primary flex-shrink-0">
                <h2 className="text-xl font-bold text-text-primary">Project Board</h2>
            </div>
            <div className="flex-grow p-4 flex space-x-4 overflow-x-auto">
              {renderColumn('To Do', tasks.todo)}
              {renderColumn('In Progress', tasks.inprogress)}
              {renderColumn('Done', tasks.done)}
            </div>
        </div>
    </aside>
  );
};
