
import React, { useMemo } from 'react';
import { SongStructure } from '../types';

interface LyricDisplayProps {
  rawText: string;
  isStreaming: boolean;
  onRedoSection?: (label: string) => void;
  loadingSection?: string | null;
}

const parseStreamingLyrics = (text: string) => {
  const lines = text.split('\n');
  let title = '';
  let style = '';
  let explanation = '';
  const lyrics: { label: string; text: string }[] = [];
  let currentLabel = '';
  let currentContent: string[] = [];

  const finalizeSection = () => {
    if (currentLabel && currentContent.length > 0) {
      lyrics.push({ label: currentLabel, text: currentContent.join('\n').trim() });
    }
    currentContent = [];
  };

  lines.forEach(line => {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('TITLE:')) {
      title = cleanLine.replace('TITLE:', '').trim();
    } else if (cleanLine.startsWith('STYLE:')) {
      style = cleanLine.replace('STYLE:', '').trim();
    } else if (cleanLine.startsWith('EXPLANATION:')) {
      explanation = cleanLine.replace('EXPLANATION:', '').trim();
    } else if (cleanLine.startsWith('[') && cleanLine.endsWith(']')) {
      finalizeSection();
      currentLabel = cleanLine.slice(1, -1);
    } else {
      if (currentLabel) {
        currentContent.push(line);
      }
    }
  });
  finalizeSection();

  return { title, style, lyrics, explanation };
};

const LyricDisplay: React.FC<LyricDisplayProps> = ({ rawText, isStreaming, onRedoSection, loadingSection }) => {
  const { title, lyrics } = useMemo(() => parseStreamingLyrics(rawText), [rawText]);

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl backdrop-blur-sm relative overflow-hidden">
      {/* Dynamic scanline effect when streaming */}
      {isStreaming && (
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20 animate-[scanline_2s_linear_infinite] pointer-events-none"></div>
      )}

      <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 min-h-[1.2em]">
        {title || (isStreaming ? 'Composing Title...' : 'Your Masterpiece')}
      </h2>
      
      <div className="space-y-4">
        {lyrics.map((section, idx) => (
          <div key={idx} className={`mb-6 group animate-in slide-in-from-left-4 duration-500 transition-opacity ${loadingSection === section.label ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold tracking-widest uppercase text-indigo-400 opacity-70">[{section.label}]</span>
              
              {!isStreaming && onRedoSection && (
                <button 
                  onClick={() => onRedoSection(section.label)}
                  disabled={!!loadingSection}
                  className="ml-2 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1 bg-slate-900/50 px-2 py-0.5 rounded-full border border-slate-700 hover:border-indigo-500/50 opacity-0 group-hover:opacity-100"
                  title={`Regenerate ${section.label}`}
                >
                  <i className={`fas fa-sync-alt ${loadingSection === section.label ? 'fa-spin' : ''}`}></i>
                  REDO
                </button>
              )}

              <div className="h-[1px] flex-grow bg-indigo-900/50 group-hover:bg-indigo-500/30 transition-colors"></div>
            </div>
            <div className={`pl-4 border-l-2 border-indigo-900/30 group-hover:border-indigo-500/50 transition-colors relative ${loadingSection === section.label ? 'after:content-[""] after:absolute after:inset-0 after:bg-indigo-500/5 after:animate-pulse' : ''}`}>
              <p className="text-lg md:text-xl font-poetic leading-relaxed whitespace-pre-wrap text-slate-200">
                {section.text}
                {isStreaming && idx === lyrics.length - 1 && (
                  <span className="inline-block w-2 h-5 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                )}
              </p>
            </div>
          </div>
        ))}

        {isStreaming && lyrics.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-4 text-slate-500">
            <i className="fas fa-feather-alt animate-bounce text-2xl"></i>
            <p className="text-sm font-medium animate-pulse">Waiting for the first lines...</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(800px); }
        }
      `}</style>
    </div>
  );
};

export default LyricDisplay;
