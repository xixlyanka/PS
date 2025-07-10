
import React from 'react';

interface CanvasPanelProps {
  isOpen: boolean;
}

export const CanvasPanel: React.FC<CanvasPanelProps> = ({ isOpen }) => {
  return (
    <aside className={`flex-shrink-0 bg-bg-secondary/80 backdrop-blur-md border-l border-border-primary/20 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-20 ${isOpen ? 'w-[550px]' : 'w-0'}`}>
        <div className="w-[550px] h-full flex flex-col">
            <div className="p-4 border-b border-border-primary">
                <h2 className="text-xl font-bold text-text-primary">Canvas & Visualizations</h2>
            </div>
            <div className="flex-grow p-4 overflow-y-auto scrollbar-thin flex items-center justify-center">
                <div className="text-center text-text-secondary">
                <p>This space is for generated charts, graphs, and other visualizations.</p>
                <p className="text-xs mt-2">Example: Network traffic graph or resource usage chart.</p>
                </div>
            </div>
        </div>
    </aside>
  );
};
