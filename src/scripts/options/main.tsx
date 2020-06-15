import React from 'react';
import ReactDOM from 'react-dom';
import { GeneralSection } from './general-section';
import { InitialItems, useInitialItems } from './initial-items';

const Main: React.FC = () => {
  const initialItems = useInitialItems();
  return (
    initialItems && (
      <InitialItems.Provider value={initialItems}>
        <GeneralSection />
      </InitialItems.Provider>
    )
  );
};

export function main(): void {
  ReactDOM.render(<Main />, document.getElementById('options'));
}
