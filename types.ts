export type ViewState = 'landing' | 'upload' | 'studio';

export interface Notebook {
  id: string;
  title: string;
  date: string;
  gradient: string;
  sourceCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  citations?: number[];
  isThinking?: boolean;
}

export interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'url';
  selected: boolean;
}

export interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
}