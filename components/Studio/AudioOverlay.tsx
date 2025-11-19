import * as React from 'react';
import * as Lucide from 'lucide-react';
import { MOCK_TRANSCRIPT } from '../../constants';

const { useEffect, useRef } = React;

interface AudioOverlayProps {
  onClose: () => void;
}

export const AudioOverlay: React.FC<AudioOverlayProps> = ({ onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll effect for transcript
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ top: 1, behavior: 'smooth' });
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Audio Overview</h3>
          <p className="text-xs text-gray-500">Deep Dive Conversation</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
        >
          <Lucide.X size={16} />
        </button>
      </div>

      {/* Visualizer */}
      <div className="h-32 bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center gap-1 px-8">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="w-2 bg-white/80 rounded-full animate-wave"
            style={{
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
              height: `${20 + Math.random() * 60}%`
            }}
          />
        ))}
      </div>

      {/* Transcript Snippet */}
      <div 
        ref={scrollRef}
        className="h-32 bg-white p-4 overflow-hidden relative"
      >
        <div className="space-y-3">
          {MOCK_TRANSCRIPT.map((line) => (
            <div key={line.id}>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{line.speaker}</span>
              <p className="text-sm text-gray-700 leading-relaxed">{line.text}</p>
            </div>
          ))}
          {/* Repeat for scrolling effect */}
          {MOCK_TRANSCRIPT.map((line) => (
            <div key={`rep-${line.id}`}>
               <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{line.speaker}</span>
               <p className="text-sm text-gray-700 leading-relaxed">{line.text}</p>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-white"></div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-6 bg-white">
         <button className="text-gray-400 hover:text-gray-600"><Lucide.Rewind size={20} /></button>
         <button className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform">
            <Lucide.Pause size={20} fill="currentColor" />
         </button>
         <button className="text-gray-400 hover:text-gray-600"><Lucide.FastForward size={20} /></button>
      </div>
    </div>
  );
};