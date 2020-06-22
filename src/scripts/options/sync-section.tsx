import React from 'react';
import ReactDOM from 'react-dom';
import { apis } from '../apis';
import * as LocalStorage from '../local-storage';
import { supportedClouds } from '../supported-clouds';
import { addMessageListeners, sendMessage } from '../messages';
import type { CloudId } from '../types';
import { dayjs } from './dayjs';
import { Dialog } from './dialog';
import { InitialItems } from './initial-items';
import { Section } from './section';
import { ShowResult } from './show-result';

interface TurnOnSyncDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setSyncCloudId: (syncCloudId: CloudId) => void;
}

const TurnOnSyncDialog: React.FC<TurnOnSyncDialogProps> = props => {
  const [syncCloudId, setSyncCloudId] = React.useState<CloudId>('googleDrive');
  React.useLayoutEffect(() => {
    if (props.open) {
      setSyncCloudId('googleDrive');
    }
  }, [props.open]);
  return (
    <Dialog open={props.open} setOpen={props.setOpen}>
      <div className="field">
        <h1 className="title">{apis.i18n.getMessage('options_turnOnSyncDialog_title')}</h1>
      </div>
      {React.Children.map(Object.keys(supportedClouds) as CloudId[], cloudId => (
        <div className="field is-grouped is-vcentered">
          <div className="control">
            <input
              id={cloudId}
              type="radio"
              name="syncCloudId"
              checked={syncCloudId === cloudId}
              onChange={e => {
                if (e.currentTarget.checked) {
                  setSyncCloudId(cloudId);
                }
              }}
            />
          </div>
          <label htmlFor={cloudId}>
            <p>{apis.i18n.getMessage(supportedClouds[cloudId].messageNames.sync)}</p>
            <p className="has-text-grey">
              {apis.i18n.getMessage(supportedClouds[cloudId].messageNames.syncDescription)}
            </p>
          </label>
        </div>
      ))}
      <div className="field is-grouped is-grouped-right">
        <div className="control">
          <button
            className="button has-text-primary"
            onClick={() => {
              props.setOpen(false);
            }}
          >
            {apis.i18n.getMessage('cancelButton')}
          </button>
        </div>
        <div className="control">
          <button
            className="button is-primary"
            onClick={() => {
              (async () => {
                const granted = await apis.permissions.request({
                  origins: supportedClouds[syncCloudId].hostPermissions,
                });
                if (!granted) {
                  return;
                }
                const connected = await sendMessage('connect-to-cloud', syncCloudId);
                if (!connected) {
                  return;
                }
                props.setSyncCloudId(syncCloudId);
                props.setOpen(false);
              })();
            }}
          >
            {apis.i18n.getMessage('options_turnOnSyncDialog_turnOnSyncButton')}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

interface TurnOnSyncProps {
  syncCloudId: CloudId | null;
  setSyncCloudId: (syncCloudId: CloudId | null) => void;
}

const TurnOnSync: React.FC<TurnOnSyncProps> = props => {
  const [turnOnSyncDialogOpen, setTurnOnSyncDialogOpen] = React.useState(false);
  if (props.syncCloudId != null) {
    return (
      <div className="field is-grouped is-vcentered">
        <div className="control is-expanded">
          <p>
            {apis.i18n.getMessage(supportedClouds[props.syncCloudId].messageNames.syncTurnedOn)}
          </p>
        </div>
        <div className="control">
          <button
            className="button has-text-primary"
            onClick={() => {
              (async () => {
                await sendMessage('disconnect-from-cloud');
                props.setSyncCloudId(null);
              })();
            }}
          >
            {apis.i18n.getMessage('options_turnOffSync')}
          </button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="field is-grouped is-vcentered">
        <div className="control is-expanded">
          <p>{apis.i18n.getMessage('options_syncFeature')}</p>
          <p className="has-text-grey">{apis.i18n.getMessage('options_syncFeatureDescription')}</p>
        </div>
        <div className="control">
          <button
            className="button is-primary"
            onClick={() => {
              setTurnOnSyncDialogOpen(true);
            }}
          >
            {apis.i18n.getMessage('options_turnOnSync')}
          </button>
          {ReactDOM.createPortal(
            <TurnOnSyncDialog
              open={turnOnSyncDialogOpen}
              setOpen={setTurnOnSyncDialogOpen}
              setSyncCloudId={props.setSyncCloudId}
            />,
            document.getElementById('turnOnSyncDialogRoot')!,
          )}
        </div>
      </div>
    );
  }
};

interface SyncNowProps {
  syncCloudId: CloudId | null;
}

const SyncNow: React.FC<SyncNowProps> = props => {
  const initialItems = React.useContext(InitialItems);
  const [syncResult, setSyncResult] = React.useState(initialItems.syncResult);
  const [syncing, setSyncing] = React.useState(false);
  React.useEffect(() => {
    addMessageListeners({
      'blacklist-syncing': () => {
        setSyncing(true);
      },
      'blacklist-synced': result => {
        setSyncResult(result);
        setSyncing(false);
      },
    });
  }, []);
  return (
    <div className="field is-grouped is-vcentered">
      <div className="control is-expanded">
        <p>{apis.i18n.getMessage('options_syncResult')}</p>
        <p className="has-text-grey">
          {syncing ? (
            apis.i18n.getMessage('options_syncRunning')
          ) : props.syncCloudId != null && syncResult ? (
            <ShowResult result={syncResult} />
          ) : (
            apis.i18n.getMessage('options_syncNever')
          )}
        </p>
      </div>
      <div className="control">
        <button
          className="button has-text-primary"
          disabled={props.syncCloudId == null || syncing}
          onClick={() => {
            sendMessage('sync-blacklist');
          }}
        >
          {apis.i18n.getMessage('options_syncNowButton')}
        </button>
      </div>
    </div>
  );
};

export const SetSyncInterval: React.FC = () => {
  const initialItems = React.useContext(InitialItems);
  const [syncInterval, setSyncInterval] = React.useState(initialItems.syncInterval);
  return (
    <div className="field is-grouped is-vcentered">
      <div className="control is-expanded">
        <label htmlFor="syncInterval">{apis.i18n.getMessage('options_syncInterval')}</label>
      </div>
      <div className="control">
        <div className="select">
          <select
            id="syncInterval"
            value={syncInterval}
            onChange={e => {
              const value = Number(e.currentTarget.value);
              setSyncInterval(value);
              LocalStorage.store({ syncInterval: value });
            }}
          >
            {[5, 15, 30, 60, 120, 300].map(value => (
              <option key={value} value={value}>
                {dayjs
                  .duration({ minutes: value })
                  .locale(apis.i18n.getMessage('dayjsLocale'))
                  .humanize(false)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export const SyncSection: React.FC = () => {
  const initialItems = React.useContext(InitialItems);
  const [syncCloudId, setSyncCloudId] = React.useState(initialItems.syncCloudId);
  // #if CHROMIUM
  /*
  // #else
  const [android, setAndroid] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const platformInfo = await browser.runtime.getPlatformInfo();
      setAndroid(platformInfo.os === 'android');
    })();
  }, []);
  if (android) {
    return null;
  }
  // #endif
  // #if CHROMIUM
  */
  // #endif
  return (
    <Section title={apis.i18n.getMessage('options_syncTitle')}>
      <TurnOnSync syncCloudId={syncCloudId} setSyncCloudId={setSyncCloudId} />
      <SyncNow syncCloudId={syncCloudId} />
      <SetSyncInterval />
    </Section>
  );
};
