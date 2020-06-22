import React from 'react';
import { apis } from '../apis';
import type { Result } from '../types';
import { isErrorResult, isSuccessResult } from '../utilities';
import { dayjs } from './dayjs';

export interface ShowResultProps {
  result: Result;
}

export const ShowResult: React.FC<ShowResultProps> = props => {
  const [, setCount] = React.useState(0);
  React.useEffect(() => {
    if (props.result && isSuccessResult(props.result)) {
      const intervalId = setInterval(() => {
        setCount(count => count + 1);
      }, 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [props.result]);
  if (isErrorResult(props.result)) {
    return <>{apis.i18n.getMessage('error', props.result.message)}</>;
  } else {
    return <>{dayjs(props.result.timestamp).fromNow()}</>;
  }
};
