import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
// Note: We import AudioPlayer from the components folder relative to root
import AudioPlayer from './components/AudioPlayer';

// --- SMART API URL (THE FIX) ---
// If in Production (Cloud), use relative path (''). 
// If Dev (Local), force connection to http://localhost:3001
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing', 'upload', 'studio'
  const [messages, setMessages] = useState([
    { id: 1, role: 'model', content: "Ready to answer based on 3 sources", citations: [] }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // Audio State
  const [audioScript, setAudioScript] = useState([]);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentFileUri, setCurrentFileUri] = useState<string | null>(null);
  const [currentFileMimeType, setCurrentFileMimeType] = useState<string | null>(null);

  const [files, setFiles] = useState<{ name: string; type: string; checked: boolean }[]>([]);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      if (data.uri) {
        setCurrentFileUri(data.uri);
        setCurrentFileMimeType(data.mimeType);
        
        // Add to files list
        setFiles(prev => [...prev, { 
          name: data.name, 
          type: data.mimeType?.includes('pdf') ? 'PDF' : 'TXT', 
          checked: true 
        }]);

        setMessages(prev => [...prev, { 
          id: Date.now(), 
          role: 'model', 
          content: `I've processed "${data.name}". You can now ask questions about it!`, 
          citations: [] 
        }]);
        
        // Switch to studio view after successful upload
        setTimeout(() => {
          setView('studio');
        }, 1000);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file. Please try again.");
    }
  };

  const toggleFile = (index: number) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, checked: !f.checked } : f));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    try {
      // CONNECT TO BACKEND
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputValue,
          fileUri: currentFileUri,
          mimeType: currentFileMimeType
        })
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setMessages(prev => [...prev, { ...data, id: Date.now() + 1 }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'model', 
        content: "Error: Could not connect to the Brain. If local, ensure 'node server.js' is running." 
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      // CONNECT TO BACKEND
      const response = await fetch(`${API_BASE}/api/audio`, { method: 'POST' });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch audio script");
      }

      const data = await response.json();
      setAudioScript(data.script);
      setShowAudioPlayer(true);
    } catch (err: any) {
      console.error("Audio Gen Error:", err);
      alert(`Error: ${err.message || "Is 'node server.js' running?"}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // --- VIEWS ---

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-1.5 rounded-lg">
              <Lucide.Sparkles size={20} />
            </div>
            <span className="text-xl font-semibold tracking-tight">InsightEngine</span>
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
            <Lucide.User size={16} />
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-medium text-center mb-2">Welcome to InsightEngine</h1>
          <p className="text-gray-500 text-center mb-12">Your personalized AI research assistant.</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <button 
              onClick={() => setView('upload')}
              className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lucide.Plus size={24} />
              </div>
              <span className="font-medium text-gray-600 group-hover:text-blue-600">New Notebook</span>
            </button>

            {[
              { title: "Globalisation since 1997", sources: 4, color: "bg-blue-100", date: "Edited 2 hours ago" },
              { title: "Genetics Research", sources: 12, color: "bg-emerald-100", date: "Edited yesterday" },
              { title: "Q3 Strategic Plan", sources: 2, color: "bg-amber-100", date: "Edited 3 days ago" }
            ].map((nb, i) => (
              <div key={i} className="flex flex-col h-64 border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className={`h-32 ${nb.color} w-full`} />
                <div className="p-5 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{nb.title}</h3>
                    <p className="text-xs text-gray-500">{nb.sources} sources</p>
                  </div>
                  <span className="text-xs text-gray-400">{nb.date}</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (view === 'upload') {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 animate-in zoom-in-95 duration-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Add sources</h2>
            <p className="text-gray-500">Upload documents to create your notebook</p>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.txt,.md,.csv"
          />

          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { icon: Lucide.Folder, label: "Drive", color: "text-blue-600 bg-blue-50", action: () => {} },
              { icon: Lucide.FileText, label: "PDF / Text", color: "text-red-600 bg-red-50", action: handleUploadClick },
              { icon: Lucide.Link, label: "Link", color: "text-emerald-600 bg-emerald-50", action: () => {} },
              { icon: Lucide.MoreHorizontal, label: "Paste Text", color: "text-purple-600 bg-purple-50", action: () => {} }
            ].map((opt, i) => (
              <button 
                key={i}
                onClick={opt.action}
                className="flex flex-col items-center justify-center p-6 border border-gray-100 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 ${opt.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <opt.icon size={20} />
                </div>
                <span className="text-sm font-medium text-gray-700">{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">Source limit</span>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="w-0 h-full bg-blue-500" />
            </div>
            <span className="text-sm text-gray-500">0 / 50</span>
          </div>
        </div>
      </div>
    );
  }

  // STUDIO VIEW
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <aside className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1 rounded">
            <Lucide.Sparkles size={16} />
          </div>
          <span className="font-semibold">InsightEngine</span>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sources</h3>
            <button onClick={handleUploadClick} className="p-1 hover:bg-gray-200 rounded"><Lucide.Plus size={16} /></button>
          </div>
          <div className="space-y-3">
            {files.map((file, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="mt-0.5 text-red-500"><Lucide.FileText size={16} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                </div>
                <div 
                  onClick={() => toggleFile(i)}
                  className={`w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-colors ${file.checked ? 'bg-blue-500 text-white' : 'border border-gray-300 bg-white'}`}
                >
                  {file.checked && <Lucide.Check size={10} />}
                </div>
              </div>
            ))}
            {files.length === 0 && (
               <div className="text-center p-4 text-gray-400 text-sm">
                 No sources added yet.
               </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-8 pb-32">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Lucide.Sparkles size={48} className="mb-4 text-gray-300" />
              <p className="text-lg">Ready to answer based on 3 sources</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'}`}>
                    {msg.role === 'user' ? <Lucide.User size={16} /> : <Lucide.Sparkles size={16} />}
                  </div>
                  <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-gray-100 rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {msg.citations.map((cite, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-[10px] font-medium text-gray-600">
                            <span className="w-3 h-3 bg-gray-200 rounded-full flex items-center justify-center text-[8px]">{idx + 1}</span>
                            {cite.title || "Source"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                 <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center animate-pulse">
                     <Lucide.Sparkles size={16} />
                   </div>
                   <span className="text-sm text-gray-400 mt-2">Thinking...</span>
                 </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-8 px-8">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSendMessage} className="bg-white rounded-full shadow-xl border border-gray-200 flex items-center p-2 pl-6 transition-shadow hover:shadow-2xl ring-1 ring-black/5">
              <Lucide.Paperclip className="text-gray-400 mr-3 cursor-pointer hover:text-gray-600" size={20} />
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question about your sources..."
                className="flex-1 bg-transparent border-none outline-none text-sm py-3 placeholder-gray-400"
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isThinking}
                className={`p-3 rounded-full transition-colors ${inputValue.trim() ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300'}`}
              >
                <Lucide.ArrowUp size={20} />
              </button>
            </form>
          </div>
        </div>
      </main>

      <aside className="w-80 border-l border-gray-200 bg-white p-6 flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-6">Studio Tools</h3>
        
        {/* AUDIO CARD */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Lucide.Volume2 size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Audio Overview</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Two hosts summarize your sources.
          </p>
          <button
            onClick={handleGenerateAudio}
            disabled={isGeneratingAudio || audioScript.length > 0}
            className={`w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors ${audioScript.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isGeneratingAudio ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : audioScript.length > 0 ? (
              "Audio Ready"
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </aside>

      {showAudioPlayer && (
        <AudioPlayer 
          script={audioScript} 
          onClose={() => setShowAudioPlayer(false)} 
        />
      )}
    </div>
  );
}