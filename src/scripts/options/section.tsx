import React from 'react';
import { apis } from '../apis';

export type SectionProps = {
  title: string;
};

export const Section: React.FC<SectionProps> = props => {
  return (
    <section className="section">
      <h1 className="title">{apis.i18n.getMessage(props.title)}</h1>
      <div className="panel">
        {React.Children.map(props.children, child => (
          <div className="panel-block">
            <div className="section-item">{child}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
