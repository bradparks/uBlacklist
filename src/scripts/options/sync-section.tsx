import React from 'react';
import { Section } from './section';

export const SyncSection: React.FC = () => {
  // #if CHROMIUM
  /*
  // #else
  const [android, setAndroid] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const platformInfo = await browser.runtime.getPlatformInfo();
      setAndroid(platformInfo.os === 'android');
    })();
  }, []);
  if (android) {
    return null;
  }
  // #endif
  // #if CHROMIUM
  */
  // #endif
  return <Section title="options_syncTitle" />;
};
