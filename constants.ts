import { Notebook, Source, TranscriptLine } from './types';

export const RECENT_NOTEBOOKS: Notebook[] = [
  {
    id: '1',
    title: 'Globalisation since 1997',
    date: 'Edited 2 hours ago',
    gradient: 'from-blue-100 to-indigo-200',
    sourceCount: 4,
  },
  {
    id: '2',
    title: 'Genetics Research',
    date: 'Edited yesterday',
    gradient: 'from-emerald-100 to-teal-200',
    sourceCount: 12,
  },
  {
    id: '3',
    title: 'Q3 Strategic Plan',
    date: 'Edited 3 days ago',
    gradient: 'from-orange-100 to-amber-200',
    sourceCount: 2,
  },
];

export const MOCK_SOURCES: Source[] = [
  { id: '1', name: 'Q3 Financial Report.pdf', type: 'pdf', selected: true },
  { id: '2', name: 'Market Analysis.txt', type: 'txt', selected: true },
  { id: '3', name: 'Competitor Overview.pdf', type: 'pdf', selected: true },
];

export const MOCK_TRANSCRIPT: TranscriptLine[] = [
  { id: '1', speaker: 'Host', text: 'Wow, looking at this Q3 report, things are really heating up.', timestamp: 0 },
  { id: '2', speaker: 'Expert', text: 'Exactly. The numbers show a clear shift in consumer behavior since July.', timestamp: 3000 },
  { id: '3', speaker: 'Host', text: 'It is fascinating how the market responded to the new product line.', timestamp: 7000 },
  { id: '4', speaker: 'Expert', text: 'Right, and that is what we see in the appendix data. A 15% uptick.', timestamp: 11000 },
];