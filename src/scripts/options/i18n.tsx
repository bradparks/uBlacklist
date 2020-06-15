import React from 'react';
import { apis } from '../apis';

export type I18nProps = {
  messageName: string;
  substitutions?: unknown;
  keyPrefix?: string;
};

export const I18n: React.FC<I18nProps> = props => {
  const message = apis.i18n.getMessage(props.messageName, props.substitutions);
  const s = message.split(/\[((?:\\\]|[^\]])*)\]\(([^)]*)\)/);
  const children: React.ReactNode[] = [];
  for (let i = 0; i < s.length; ++i) {
    switch (i % 3) {
      case 0:
        children.push(s[i]);
        break;
      case 1:
        children.push(
          <a key={`${props.keyPrefix ?? ''}${i}`} href={s[i + 1]} rel="noreferrer" target="_blank">
            {s[i]}
          </a>,
        );
        ++i;
        break;
    }
  }
  return <>{children}</>;
};
