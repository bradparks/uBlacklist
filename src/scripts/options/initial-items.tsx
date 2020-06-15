import React from 'react';
import * as LocalStorage from '../local-storage';

export type InitialItemsType = LocalStorage.ItemsFor<
  ['blacklist', 'skipBlockDialog', 'hideBlockLinks', 'hideControl']
>;

export const InitialItems = React.createContext({} as InitialItemsType);

export function useInitialItems(): InitialItemsType | null {
  const [initialItems, setInitialItems] = React.useState<InitialItemsType | null>(null);
  React.useEffect(() => {
    (async () => {
      const initialItems = await LocalStorage.load([
        'blacklist',
        'skipBlockDialog',
        'hideBlockLinks',
        'hideControl',
      ]);
      setInitialItems(initialItems);
    })();
  }, []);
  return initialItems;
}
