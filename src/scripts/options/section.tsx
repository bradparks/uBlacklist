import React from 'react';

export type SectionProps = {
  title: string;
};

export const Section: React.FC<Readonly<SectionProps>> = props => (
  <section className="section">
    <h1 className="title">{props.title}</h1>
    <div className="panel">
      {React.Children.map(props.children, child => (
        <div className="ub-section-item panel-block">{child}</div>
      ))}
    </div>
  </section>
);
