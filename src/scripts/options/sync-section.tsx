import React from 'react';
import ReactDOM from 'react-dom';
import { apis } from '../apis';
import { CLOUD_STORAGES } from '../cloud-storages';
import { addMessageListeners, sendMessage } from '../messages';
import type { CloudStorageId, Result } from '../types';
import { isErrorResult } from '../utilities';
import { dayjs } from './dayjs';
import { Dialog } from './dialog';
import { InitialItems } from './initial-items';
import { Section } from './section';

interface TurnOnSyncDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setCurrentCloudStorageId: (currentCloudStorageId: CloudStorageId) => void;
}

const TurnOnSyncDialog: React.FC<TurnOnSyncDialogProps> = props => {
  const [currentCloudStorageId, setCurrentCloudStorageId] = React.useState<CloudStorageId>(
    'googleDrive',
  );
  React.useLayoutEffect(() => {
    if (props.open) {
      setCurrentCloudStorageId('googleDrive');
    }
  }, [props.open]);
  return (
    <Dialog open={props.open} setOpen={props.setOpen}>
      <div className="field">
        <h1 className="title">{apis.i18n.getMessage('options_turnOnSyncDialog_title')}</h1>
      </div>
      <div className="field">
        {React.Children.map(Object.keys(CLOUD_STORAGES) as CloudStorageId[], cloudStorageId => (
          <div className="radio-wrapper">
            <input
              id={cloudStorageId}
              type="radio"
              name="currentCloudStorageId"
              checked={currentCloudStorageId === cloudStorageId}
              onChange={e => {
                if (e.currentTarget.checked) {
                  setCurrentCloudStorageId(cloudStorageId);
                }
              }}
            />
            <label className="radio-label-wrapper" htmlFor={cloudStorageId}>
              {apis.i18n.getMessage(CLOUD_STORAGES[cloudStorageId].messageName)}
            </label>
          </div>
        ))}
      </div>
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
                  origins: CLOUD_STORAGES[currentCloudStorageId].hostPermissions,
                });
                if (!granted) {
                  return;
                }
                try {
                  await sendMessage('connect-to-cloud-storage', currentCloudStorageId);
                } catch {
                  return;
                }
                props.setCurrentCloudStorageId(currentCloudStorageId);
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
  currentCloudStorageId: CloudStorageId | null;
  setCurrentCloudStorageId: (currentCloudStorageId: CloudStorageId | null) => void;
}

const TurnOnSync: React.FC<TurnOnSyncProps> = props => {
  const [turnOnSyncDialogOpen, setTurnOnSyncDialogOpen] = React.useState(false);
  if (props.currentCloudStorageId == null) {
    return (
      <div className="columns is-vcentered">
        <div className="column">
          <p>{apis.i18n.getMessage('options_syncFeature')}</p>
          <p className="has-text-grey">{apis.i18n.getMessage('options_syncFeatureDescription')}</p>
        </div>
        <div className="column is-narrow">
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
              setCurrentCloudStorageId={props.setCurrentCloudStorageId}
            />,
            document.getElementById('turnOnSyncDialogRoot')!,
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="columns is-vcentered">
        <div className="column">
          <p>
            {apis.i18n.getMessage(
              'options_syncTurnedOn',
              apis.i18n.getMessage(CLOUD_STORAGES[props.currentCloudStorageId].messageName),
            )}
          </p>
        </div>
        <div className="column is-narrow">
          <button
            className="button has-text-primary"
            onClick={() => {
              (async () => {
                await sendMessage('disconnect-from-cloud-storage');
                props.setCurrentCloudStorageId(null);
              })();
            }}
          >
            {apis.i18n.getMessage('options_turnOffSync')}
          </button>
        </div>
      </div>
    );
  }
};

function syncResultToString(syncResult: Result | null) {
  if (syncResult == null) {
    return apis.i18n.getMessage('options_syncNever');
  } else if (isErrorResult(syncResult)) {
    return apis.i18n.getMessage('error', syncResult.message);
  } else {
    return dayjs(syncResult.timestamp).fromNow();
  }
}

interface SyncNowProps {
  currentCloudStorageId: CloudStorageId | null;
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
    <div className="columns is-vcentered">
      <div className="column">
        <p>{apis.i18n.getMessage('options_syncResult')}</p>
        <p className="has-text-grey">
          {syncing ? apis.i18n.getMessage('options_syncRunning') : syncResultToString(syncResult)}
        </p>
      </div>
      <div className="column is-narrow">
        <button
          className="button has-text-primary"
          disabled={props.currentCloudStorageId == null || syncing}
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

export const SyncSection: React.FC = () => {
  const initialItems = React.useContext(InitialItems);
  const [currentCloudStorageId, setCurrentCloudStorageId] = React.useState(
    initialItems.currentCloudStorageId,
  );
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
      <TurnOnSync
        currentCloudStorageId={currentCloudStorageId}
        setCurrentCloudStorageId={setCurrentCloudStorageId}
      />
      <SyncNow currentCloudStorageId={currentCloudStorageId} />
    </Section>
  );
};
