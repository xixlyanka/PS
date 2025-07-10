
import React from 'react';
import { Panel } from '../types';
import { SettingsIcon, CodeIcon, LogsIcon, CanvasIcon, ProjectBoardIcon } from './icons';

interface PanelToggleProps {
  activePanels: Set<Panel>;
  togglePanel: (panel: Panel) => void;
}

const panelConfig = [
  { id: Panel.SIDEBAR, Icon: SettingsIcon, title: 'Settings & Models' },
  { id: Panel.CODE, Icon: CodeIcon, title: 'Code IDE' },
  { id: Panel.LOGS, Icon: LogsIcon, title: 'System Logs' },
  { id: Panel.CANVAS, Icon: CanvasIcon, title: 'Canvas & Visualization' },
  { id: Panel.PROJECT_BOARD, Icon: ProjectBoardIcon, title: 'Project Board' },
];

export const PanelToggle: React.FC<PanelToggleProps> = ({ activePanels, togglePanel }) => {
  return (
    <nav className="flex flex-row items-center space-x-2 p-1 bg-bg-secondary/50 backdrop-blur-sm rounded-lg border border-border-primary/20">
      {panelConfig.map(({ id, Icon, title }) => (
        <button
          key={id}
          onClick={() => togglePanel(id)}
          title={title}
          className={`p-3 rounded-md transition-colors duration-200 ${
            activePanels.has(id)
              ? 'bg-accent text-bg-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
          }`}
        >
          <Icon className="w-6 h-6" />
        </button>
      ))}
    </nav>
  );
};
