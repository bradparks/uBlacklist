import React from 'react';
import ReactDOM from 'react-dom';
import { apis } from '../apis';
import { ENGINES } from '../engines';
import * as LocalStorage from '../local-storage';
import { sendMessage } from '../messages';
import type { Engine } from '../types';
import { lines, unlines } from '../utilities';
import { Dialog } from './dialog';
import { InitialItems } from './initial-items';
import { Section } from './section';
import { Switch } from './switch';

const enum BlacklistStatus {
  Clean,
  Dirty,
  DirtyImport,
}

type ImportBlacklistDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  importBlacklist: (blacklist: string) => void;
};

const ImportBlacklistDialog: React.FC<ImportBlacklistDialogProps> = props => {
  const [domains, setDomains] = React.useState('');
  React.useEffect(() => {
    setDomains('');
  }, [props.open]);
  return (
    <Dialog open={props.open} setOpen={props.setOpen}>
      <div className="field">
        <h1 className="title">{apis.i18n.getMessage('options_importBlacklistDialog_title')}</h1>
      </div>
      <div className="field">
        <p className="help has-text-grey">
          {apis.i18n.getMessage('options_importBlacklistDialog_helper')}
          <br />
          {apis.i18n.getMessage('options_blacklistExample', 'example.com')}
        </p>
      </div>
      <div className="field">
        <div className="control">
          <textarea
            className="textarea has-fixed-size"
            rows={10}
            spellCheck="false"
            value={domains}
            onChange={e => {
              setDomains(e.currentTarget.value);
            }}
          ></textarea>
        </div>
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
              const rules: string[] = [];
              for (const domain of lines(domains)) {
                if (/^[^/*]+$/.test(domain)) {
                  rules.push(`*://*.${domain}/*`);
                }
              }
              props.importBlacklist(unlines(rules));
              props.setOpen(false);
            }}
          >
            {apis.i18n.getMessage('options_importBlacklistDialog_importButton')}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const Blacklist: React.FC = () => {
  const { blacklist: initialBlacklist } = React.useContext(InitialItems);
  const [blacklist, setBlacklist] = React.useState(initialBlacklist);
  const [blacklistStatus, setBlacklistStatus] = React.useState(BlacklistStatus.Clean);
  const [importBlacklistDialogOpen, setImportBlacklistDialogOpen] = React.useState(false);
  const blacklistTextArea = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    if (blacklistStatus === BlacklistStatus.DirtyImport) {
      blacklistTextArea.current!.scrollTop = blacklistTextArea.current!.scrollHeight;
    }
  }, [blacklist, blacklistStatus]);
  return (
    <>
      <div className="field">
        <p>{apis.i18n.getMessage('options_blacklistLabel')}</p>
        <p className="help has-text-grey">
          <span
            dangerouslySetInnerHTML={{ __html: apis.i18n.getMessage('options_blacklistHelper') }}
          />
          <br />
          {apis.i18n.getMessage('options_blacklistExample', '*://*.example.com/*')}
          <br />
          {apis.i18n.getMessage('options_blacklistExample', '/example\\.(net|org)/')}
        </p>
      </div>
      <div className="field">
        <div className="control">
          <textarea
            className="textarea has-fixed-size"
            ref={blacklistTextArea}
            rows={10}
            spellCheck={false}
            value={blacklist}
            onChange={e => {
              setBlacklist(e.target.value);
              setBlacklistStatus(BlacklistStatus.Dirty);
            }}
          />
        </div>
      </div>
      <div className="field is-grouped is-grouped-right">
        <div className="control">
          <button
            className="button has-text-primary"
            onClick={() => {
              setImportBlacklistDialogOpen(true);
            }}
          >
            {apis.i18n.getMessage('options_importBlacklistButton')}
          </button>
        </div>
        {ReactDOM.createPortal(
          <ImportBlacklistDialog
            open={importBlacklistDialogOpen}
            setOpen={setImportBlacklistDialogOpen}
            importBlacklist={newBlacklist => {
              if (newBlacklist) {
                setBlacklist(`${blacklist}${blacklist ? '\n' : ''}${newBlacklist}`);
                setBlacklistStatus(BlacklistStatus.DirtyImport);
              }
            }}
          />,
          document.getElementById('importBlacklistDialogRoot')!,
        )}
        <div className="control">
          <button
            className="button is-primary"
            disabled={blacklistStatus === BlacklistStatus.Clean}
            onClick={() => {
              sendMessage('set-blacklist', blacklist);
              setBlacklistStatus(BlacklistStatus.Clean);
            }}
          >
            {apis.i18n.getMessage('options_saveBlacklistButton')}
          </button>
        </div>
      </div>
    </>
  );
};

type ItemSwitchProps = {
  itemKey: 'skipBlockDialog' | 'hideBlockLinks' | 'hideControl';
  label: string;
};

type SearchEngineProps = {
  searchEngine: Engine;
};

const SearchEngine: React.FC<SearchEngineProps> = props => {
  const [enabled, setEnabled] = React.useState(false);
  React.useLayoutEffect(() => {
    (async () => {
      const enabled = await apis.permissions.contains({ origins: props.searchEngine.matches });
      setEnabled(enabled);
    })();
  }, [props.searchEngine]);
  return (
    <div className="columns is-vcentered">
      <div className="column">
        <label>{props.searchEngine.name}</label>
      </div>
      <div className="column is-narrow">
        {!enabled && (
          <button
            className="button is-primary"
            onClick={async () => {
              const enabled = await apis.permissions.request({
                origins: props.searchEngine.matches,
              });
              setEnabled(enabled);
              if (enabled) {
                sendMessage('enable-on-engine', props.searchEngine);
              }
            }}
          >
            {apis.i18n.getMessage('options_enableOnSearchEngine')}
          </button>
        )}
        {enabled && (
          <button className="button has-text-primary" disabled>
            {apis.i18n.getMessage('options_enabledOnSearchEngine')}
          </button>
        )}
      </div>
    </div>
  );
};

const SearchEngines: React.FC = () => {
  return (
    <>
      <p>{apis.i18n.getMessage('options_otherSearchEngines')}</p>
      <p className="has-text-grey">
        {apis.i18n.getMessage('options_otherSearchEnginesDescription')}
      </p>
      <ul>
        {ENGINES.map(engine => (
          <li className="search-engine" key={engine.id}>
            <SearchEngine searchEngine={engine} />
          </li>
        ))}
      </ul>
    </>
  );
};

const ItemSwitch: React.FC<ItemSwitchProps> = props => {
  const { [props.itemKey]: initialItem } = React.useContext(InitialItems);
  const [item, setItem] = React.useState(initialItem);
  return (
    <Switch
      label={props.label}
      value={item}
      onChange={e => {
        setItem(e.target.checked);
        LocalStorage.store({ [props.itemKey]: e.target.checked });
      }}
    />
  );
};

export const GeneralSection: React.FC = () => (
  <Section title={apis.i18n.getMessage('options_generalTitle')}>
    <Blacklist />
    <SearchEngines />
    <ItemSwitch
      itemKey="skipBlockDialog"
      label={apis.i18n.getMessage('options_skipBlockDialogLabel')}
    />
    <ItemSwitch
      itemKey="hideBlockLinks"
      label={apis.i18n.getMessage('options_hideBlockLinksLabel')}
    />
    <ItemSwitch itemKey="hideControl" label={apis.i18n.getMessage('options_hideControlLabel')} />
  </Section>
);
