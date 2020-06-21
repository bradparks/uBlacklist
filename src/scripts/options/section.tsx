import React from 'react';

export type SectionProps = {
  title: string;
};

export const Section: React.FC<SectionProps> = props => (
  <section className="section">
    <div className="container">
      <h1 className="title">{props.title}</h1>
      <div className="panel">
        {React.Children.map(props.children, child => (
          <div className="panel-block">
            <div className="section-item">{child}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
