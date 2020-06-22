import type { SearchEngines } from './types';

export const supportedSearchEngines: SearchEngines = [
  {
    id: 'duckduckgo',
    messageNames: {
      name: 'searchEngines_duckduckgoName',
    },
    matches: [
      '*://duckduckgo.com/',
      '*://duckduckgo.com//',
      '*://duckduckgo.com/?*',
      '*://safe.duckduckgo.com/',
      '*://safe.duckduckgo.com//',
      '*://safe.duckduckgo.com/?*',
      '*://start.duckduckgo.com/',
      '*://start.duckduckgo.com//',
      '*://start.duckduckgo.com/?*',
    ],
  },
  {
    id: 'startpage',
    messageNames: {
      name: 'searchEngines_startpageName',
    },
    matches: [
      'https://startpage.com/do/*',
      'https://startpage.com/sp/*',
      'https://www.startpage.com/do/*',
      'https://www.startpage.com/rvd/*',
      'https://www.startpage.com/sp/*',
    ],
  },
];
