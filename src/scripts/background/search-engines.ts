import { apis } from '../apis';
import { supportedSearchEngines } from '../supported-search-engines';
import type { SearchEngine } from '../types';
import { AltURL, MatchPattern } from '../utilities';

// #if CHROMIUM
const contentScripts = supportedSearchEngines.map(searchEngine => ({
  css: [`/styles/search-engines/${searchEngine.id}.css`, '/styles/content.css'],
  js: [`/scripts/search-engines/${searchEngine.id}.js`, '/scripts/content.js'],
  matches: searchEngine.matches.map(match => new MatchPattern(match)),
}));
// #endif

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function register(searchEngine: SearchEngine): Promise<void> {
  // #if CHROMIUM
  /*
  // #else
  await browser.contentScripts.register({
    css: [
      { file: `/styles/search-engines/${searchEngine.id}.css` },
      { file: '/styles/content.css' },
    ],
    js: [
      { file: `/scripts/search-engines/${searchEngine.id}.js` },
      { file: '/scripts/content.js' },
    ],
    matches: searchEngine.matches,
    runAt: 'document_start',
  });
  // #endif
  // #if CHROMIUM
  */
  // #endif
}

export async function registerAll(): Promise<void> {
  // #if CHROMIUM
  apis.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'loading' || tab.url == null) {
      return;
    }
    const altURL = new AltURL(tab.url);
    const contentScript = contentScripts.find(contentScript =>
      contentScript.matches.some(match => match.test(altURL)),
    );
    if (!contentScript) {
      return;
    }
    const result = await apis.tabs.executeScript(tabId, {
      file: '/scripts/has-content-handlers.js',
      runAt: 'document_start',
    });
    if (result[0]) {
      return;
    }
    for (const css of contentScript.css) {
      apis.tabs.insertCSS(tabId, {
        file: css,
        runAt: 'document_start',
      });
    }
    for (const js of contentScript.js) {
      apis.tabs.executeScript(tabId, {
        file: js,
        runAt: 'document_start',
      });
    }
  });
  /*
  // #else
  for (const searchEngine of supportedSearchEngines) {
    if (await apis.permissions.contains({ origins: searchEngine.matches })) {
      await register(searchEngine);
    }
  }
  // #endif
  // #if CHROMIUM
  */
  // #endif
}
