import React from 'react';
import { I18n } from './i18n';

export interface SwitchProps {
  label: string;
  value?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

let nextId = 0;

export const Switch: React.FC<SwitchProps> = props => {
  const [id] = React.useState(`_switch_${nextId}`);
  ++nextId;
  return (
    <div className="columns is-vcentered">
      <div className="column">
        <label htmlFor={id}>
          <I18n messageName={props.label} />
        </label>
      </div>
      <div className="column is-narrow">
        <div className="switch-wrapper">
          <input
            id={id}
            className="switch is-rounded"
            type="checkbox"
            checked={props.value}
            onChange={props.onChange}
          />
          <label className="label" htmlFor={id} />
        </div>
      </div>
    </div>
  );
};
