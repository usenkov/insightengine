import * as React from 'react';
import * as Lucide from 'lucide-react';
import { MOCK_SOURCES } from '../../constants';
import { Message } from '../../types';
import { AudioOverlay } from './AudioOverlay';

const { useState, useRef, useEffect } = React;

export const StudioLayout: React.FC = () => {
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Audio State
  const [audioState, setAudioState] = useState<'idle' | 'generating' | 'playing'>('idle');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    // Simulate AI Response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: "Based on the Q3 Financial Report, the revenue growth was primarily driven by the Asia-Pacific expansion and the new 'Horizon' product line. The operational costs, however, increased by 12% due to supply chain adjustments.",
        citations: [1, 2],
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 1500);
  };

  const handleGenerateAudio = () => {
    setAudioState('generating');
    setTimeout(() => {
      setAudioState('playing'); // Auto play after generation for demo
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      
      {/* LEFT SIDEBAR: Sources */}
      <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Sources</h2>
          <button className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500">
            <Lucide.Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {MOCK_SOURCES.map(source => (
            <div key={source.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors group cursor-pointer">
              <div className="mt-0.5 text-red-500">
                <Lucide.FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{source.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Processed</p>
              </div>
              <div className={`mt-0.5 rounded-md p-0.5 ${source.selected ? 'bg-blue-100 text-blue-600' : 'text-gray-300'}`}>
                <Lucide.Check size={14} />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 text-center text-xs text-gray-400">
          3 sources loaded
        </div>
      </div>

      {/* CENTER: Chat Interface */}
      <div className="flex-1 flex flex-col bg-white relative">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide pb-32"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Lucide.Sparkles size={32} className="text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-600">Ready to answer based on 3 sources</p>
              <p className="text-sm mt-2">Ask anything about your documents</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white">
                    <Lucide.Sparkles size={14} />
                  </div>
                )}
                <div className={`max-w-2xl ${msg.role === 'user' ? 'bg-gray-100 rounded-2xl px-5 py-3 text-gray-800' : ''}`}>
                  <p className="text-gray-800 leading-relaxed">{msg.text}</p>
                  {msg.citations && (
                    <div className="flex gap-2 mt-3">
                      {msg.citations.map(c => (
                        <span key={c} className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer transition-colors">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isThinking && (
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white">
                  <Lucide.Sparkles size={14} />
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Lucide.Loader2 size={16} className="animate-spin" />
                  Thinking...
                </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-lg rounded-full px-6 py-4 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
            <Lucide.Paperclip className="text-gray-400 hover:text-gray-600 cursor-pointer" size={20} />
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question about your sources..."
              className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isThinking}
              className={`p-2 rounded-full transition-colors ${inputValue.trim() ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-300'}`}
            >
              <Lucide.Send size={18} />
            </button>
          </div>
          <div className="text-center mt-3 text-xs text-gray-400">
            InsightEngine can make mistakes. Review generated responses.
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Tools */}
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 hidden xl:block">
        <h3 className="font-semibold text-gray-700 mb-4">Studio Tools</h3>
        
        {/* Audio Card */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-gray-800">Audio Overview</h4>
            <Lucide.Volume2 size={18} className="text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mb-4 leading-snug">
            Two hosts summarize your sources. Great for listening on the go.
          </p>
          
          {audioState === 'idle' && (
            <button 
              onClick={handleGenerateAudio}
              className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Generate
            </button>
          )}

          {audioState === 'generating' && (
            <button 
              disabled
              className="w-full py-2 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Lucide.Loader2 size={16} className="animate-spin" />
              Generating...
            </button>
          )}

          {audioState === 'playing' && (
            <button 
              onClick={() => setAudioState('playing')} // Keeps visual state active
              className="w-full py-2 px-4 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Lucide.Play size={16} fill="currentColor" />
              Play
            </button>
          )}
        </div>

        <div className="mt-6">
           <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Suggested Actions</h4>
           <div className="space-y-2">
              <button className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-300 transition-colors">
                Create a timeline of events
              </button>
              <button className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-300 transition-colors">
                Draft a briefing document
              </button>
              <button className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-300 transition-colors">
                Critique the arguments
              </button>
           </div>
        </div>
      </div>

      {audioState === 'playing' && <AudioOverlay onClose={() => setAudioState('idle')} />}

    </div>
  );
};