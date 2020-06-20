import React from 'react';
import ReactDOM from 'react-dom';
import { GeneralSection } from './general-section';
import { InitialItemsProvider } from './initial-items';
import { SyncSection } from './sync-section';

const Main: React.FC = () => (
  <InitialItemsProvider>
    <div className="main">
      <GeneralSection />
      <SyncSection />
    </div>
  </InitialItemsProvider>
);

export function main(): void {
  ReactDOM.render(<Main />, document.getElementById('mainRoot'));
}
