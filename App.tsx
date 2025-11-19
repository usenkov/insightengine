import * as React from 'react';
import * as Lucide from 'lucide-react';
import { Header } from './components/Header';
import { StudioLayout } from './components/Studio/StudioLayout';
import { RECENT_NOTEBOOKS } from './constants';
import { ViewState } from './types';

const { useState } = React;

const LandingPage: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => {
  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10">
      <div className="text-center mb-12 pt-8">
        <h1 className="text-4xl font-medium text-gray-900 mb-2 tracking-tight">Welcome to InsightEngine</h1>
        <p className="text-lg text-gray-500">Your personalized AI research assistant.</p>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">My Notebooks</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* New Notebook Card */}
        <div 
          onClick={onCreateNew}
          className="group h-64 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 text-blue-600 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
            <Lucide.Plus size={32} />
          </div>
          <span className="text-lg font-medium text-gray-600 group-hover:text-blue-600">New Notebook</span>
        </div>

        {/* Recent Notebooks */}
        {RECENT_NOTEBOOKS.map((notebook) => (
          <div key={notebook.id} className="group h-64 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col cursor-pointer relative">
             {/* Gradient Cover */}
             <div className={`h-32 bg-gradient-to-br ${notebook.gradient} p-4 relative`}>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 p-1 rounded-full hover:bg-white">
                    <Lucide.MoreHorizontal size={16} className="text-gray-700" />
                </div>
             </div>
             {/* Content */}
             <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg leading-tight mb-1">{notebook.title}</h3>
                  <p className="text-xs text-gray-500">{notebook.sourceCount} sources</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                   <span>{notebook.date}</span>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UploadModal: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  if (uploading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-medium text-gray-800">Processing sources...</h3>
        <p className="text-gray-500 mt-2">Analyzing documents and extracting insights</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 relative">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">Add sources</h2>
        <p className="text-center text-gray-500 mb-10">Upload documents to create your notebook</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           {[
             { icon: Lucide.Folder, label: "Drive", color: "text-blue-600 bg-blue-50" },
             { icon: Lucide.FileText, label: "PDF / Text", color: "text-red-600 bg-red-50" },
             { icon: Lucide.Link, label: "Link", color: "text-emerald-600 bg-emerald-50" },
             { icon:  Lucide.MoreHorizontal, label: "Paste Text", color: "text-purple-600 bg-purple-50" }
           ].map((item, idx) => (
             <div 
                key={idx} 
                onClick={handleUpload}
                className="h-40 border border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/10 hover:shadow-md transition-all"
             >
                <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center`}>
                  <item.icon size={24} />
                </div>
                <span className="font-medium text-gray-700">{item.label}</span>
             </div>
           ))}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <span>Source limit</span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-0 bg-blue-500"></div>
            </div>
            <span>0 / 50</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>('landing');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header currentView={view} onLogoClick={() => setView('landing')} />
      
      <main>
        {view === 'landing' && (
          <LandingPage onCreateNew={() => setView('upload')} />
        )}
        
        {view === 'upload' && (
          <UploadModal onComplete={() => setView('studio')} />
        )}

        {view === 'studio' && (
          <StudioLayout />
        )}
      </main>
    </div>
  );
}