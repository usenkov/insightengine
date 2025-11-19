import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, X, Radio } from "lucide-react";

export default function AudioPlayer({
  script = [],
  onClose,
}: {
  script: any[];
  onClose: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const safeScript = Array.isArray(script) ? script : [];

  useEffect(() => {
    let interval: any;
    if (isPlaying && currentLineIndex < safeScript.length) {
      const currentText = safeScript[currentLineIndex]?.text || "";
      const wordCount = currentText.split(" ").length;
      const durationMs = Math.max(2000, (wordCount / 2.5) * 1000);
      const tickRate = 100;
      const step = (tickRate / durationMs) * 100;

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentLineIndex((idx) => {
              const nextIdx = idx + 1;
              if (nextIdx >= safeScript.length) {
                setIsPlaying(false);
                return idx;
              }
              return nextIdx;
            });
            return 0;
          }
          return prev + step;
        });
      }, tickRate);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentLineIndex, safeScript]);

  useEffect(() => {
    if (lineRefs.current[currentLineIndex]) {
      lineRefs.current[currentLineIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLineIndex]);

  if (safeScript.length === 0) return null;

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-full md:w-[400px] flex flex-col bg-white shadow-xl border-l border-gray-200">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Radio size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Audio Overview</h3>
            <p className="text-xs text-gray-500">Deep Dive Podcast</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {safeScript.map((line, idx) => (
          <div
            key={idx}
            ref={(el) => {
              lineRefs.current[idx] = el;
            }}
            className={`transition-all duration-300 cursor-pointer ${
              idx === currentLineIndex ? "opacity-100 scale-105" : "opacity-50"
            }`}
            onClick={() => {
              setCurrentLineIndex(idx);
              setIsPlaying(true);
            }}
          >
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                line.speaker === "Host"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {line.speaker}
            </span>
            <p className="text-sm font-medium text-gray-800 mt-1 leading-relaxed">
              {typeof line.text === "string"
                ? line.text
                : JSON.stringify(line.text)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
