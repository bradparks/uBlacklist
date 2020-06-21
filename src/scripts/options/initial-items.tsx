import React from 'react';
import * as LocalStorage from '../local-storage';

export type InitialItemsType = LocalStorage.ItemsFor<
  [
    'blacklist',
    'skipBlockDialog',
    'hideBlockLinks',
    'hideControl',
    'currentCloudStorageId',
    'syncResult',
  ]
>;

export const InitialItems = React.createContext({} as InitialItemsType);

export const InitialItemsProvider: React.FC = props => {
  const [initialItems, setInitialItems] = React.useState<InitialItemsType | null>(null);
  React.useEffect(() => {
    (async () => {
      const initialItems = await LocalStorage.load([
        'blacklist',
        'skipBlockDialog',
        'hideBlockLinks',
        'hideControl',
        'currentCloudStorageId',
        'syncResult',
      ]);
      setInitialItems(initialItems);
    })();
  }, []);
  return (
    initialItems && (
      <InitialItems.Provider value={initialItems}>{props.children}</InitialItems.Provider>
    )
  );
};
