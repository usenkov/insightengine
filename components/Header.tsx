import * as React from 'react';
import * as Lucide from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  currentView: ViewState;
  onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onLogoClick }) => {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-50">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onLogoClick}
      >
        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-500 rounded-lg flex items-center justify-center text-white">
          <Lucide.Sparkles size={18} />
        </div>
        <span className="text-xl font-semibold text-gray-800 tracking-tight">
          InsightEngine
        </span>
        {currentView === 'studio' && (
           <span className="ml-4 text-sm text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
             New Notebook
           </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 border border-gray-300 cursor-pointer hover:bg-gray-300 transition-colors">
          <Lucide.User size={16} />
        </div>
      </div>
    </header>
  );
};