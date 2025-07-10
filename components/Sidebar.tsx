
import React, { useState } from 'react';
import { OllamaModel, RoleModels, OllamaRole } from '../types';
import { SunIcon, MoonIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  ollamaModels: OllamaModel[];
  roleModels: RoleModels;
  onModelChange: (role: OllamaRole, modelName: string) => void;
  onPullModel: (modelName: string) => void;
  pullProgress: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  theme,
  setTheme,
  ollamaModels,
  roleModels,
  onModelChange,
  onPullModel,
  pullProgress,
}) => {
  const [modelToPull, setModelToPull] = useState('');

  const handlePullClick = () => {
    if (modelToPull.trim()) {
      onPullModel(modelToPull.trim());
      setModelToPull('');
    }
  };

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-text-primary mb-3 border-b border-border-primary pb-2">{title}</h3>
      {children}
    </div>
  );

  const Select = ({ role }: { role: OllamaRole }) => (
    <div className="mb-3">
      <label htmlFor={role} className="block text-sm font-medium text-text-secondary mb-1">
        {role.replace(/_/g, ' ').replace('MODEL', '').trim()}
      </label>
      <select
        id={role}
        data-role={role}
        value={roleModels[role]}
        onChange={(e) => onModelChange(role, e.target.value)}
        className="w-full bg-bg-primary border border-border-primary text-text-primary rounded-md p-2 focus:ring-2 focus:ring-accent focus:border-accent transition"
      >
        <option value="">Select a model...</option>
        {ollamaModels.length > 0 ? (
          ollamaModels.map(m => <option key={m.name} value={m.name}>{m.name}</option>)
        ) : (
          <option disabled>No models found</option>
        )}
      </select>
    </div>
  );
  
  const PermissionToggle: React.FC<{ label: string, id: string, warning?: string }> = ({ label, id, warning }) => (
      <div className="flex items-center justify-between py-2">
          <div>
            <label htmlFor={id} className="text-sm font-medium text-text-primary">{label}</label>
            {warning && <p className="text-xs text-red-500/80">{warning}</p>}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" id={id} className="sr-only peer" />
              <div className="w-11 h-6 bg-bg-tertiary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
          </label>
      </div>
  );


  return (
    <aside className={`flex-shrink-0 bg-bg-secondary/80 backdrop-blur-md border-r border-border-primary/20 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-20 ${isOpen ? 'w-80' : 'w-0'}`}>
      <div className="w-80 p-4 h-full overflow-y-auto scrollbar-thin">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Settings</h2>
        
        <Section title="Theme">
          <div className="flex items-center justify-between bg-bg-primary p-2 rounded-lg">
            <span className="text-sm font-medium text-text-secondary">Switch Theme</span>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full text-text-primary bg-bg-tertiary hover:bg-accent hover:text-bg-primary transition-all">
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          </div>
        </Section>

        <Section title="Model Selection">
          <Select role={OllamaRole.ORCHESTRATOR} />
          <Select role={OllamaRole.SPEAKER} />
          <Select role={OllamaRole.ANALYST} />
          <Select role={OllamaRole.CODER} />
        </Section>

        <Section title="Manage Ollama Models">
          <input
            type="text"
            value={modelToPull}
            onChange={(e) => setModelToPull(e.target.value)}
            placeholder="e.g., llama3:latest"
            className="w-full bg-bg-primary border border-border-primary text-text-primary rounded-md p-2 mb-2 focus:ring-2 focus:ring-accent focus:border-accent transition"
          />
          <button
            onClick={handlePullClick}
            className="w-full bg-accent text-bg-primary font-semibold py-2 px-4 rounded-md hover:bg-accent-hover transition-colors"
            disabled={!!pullProgress}
          >
            {pullProgress ? 'Pulling...' : 'Pull Model'}
          </button>
          {pullProgress && (
              <div className="mt-2 p-2 bg-bg-primary rounded-md border border-border-primary text-xs text-text-secondary animate-pulse">
                {pullProgress}
              </div>
          )}
        </Section>
        
        <Section title="Fine-tuning Data">
            <PermissionToggle label="Enable data recording" id="fine-tune-toggle" />
            <div className="text-xs text-text-secondary mt-2 p-2 bg-bg-primary rounded-md border border-border-primary">
                <span className="font-semibold block">Path:</span>
                <span className="break-all">/Users/user/Singularity_Finetune.jsonl</span>
            </div>
             <button className="w-full mt-2 bg-bg-tertiary text-text-primary font-semibold py-2 px-4 rounded-md hover:bg-accent hover:text-bg-primary transition-colors text-sm">
                Change Path
            </button>
        </Section>

        <Section title="System Access Permissions">
            <PermissionToggle label="Read any file" id="perm-read-any" />
            <PermissionToggle label="Write in home dir" id="perm-write-home" />
            <PermissionToggle label="Write anywhere" id="perm-write-any" warning="High risk!"/>
            <PermissionToggle label="Execute system commands" id="perm-exec-cmd" />
            <PermissionToggle label="Network Scanning (nmap)" id="perm-nmap" />
            <PermissionToggle label="Execute exploits" id="perm-exploit" warning="EXTREME RISK!"/>
        </Section>

      </div>
    </aside>
  );
};
