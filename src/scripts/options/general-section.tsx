import React from 'react';
import ReactDOM from 'react-dom';
import { apis } from '../apis';
import * as LocalStorage from '../local-storage';
import { sendMessage } from '../messages';
import { supportedSearchEngines } from '../supported-search-engines';
import type { SearchEngine } from '../types';
import { lines, unlines } from '../utilities';
import { Dialog } from './dialog';
import { InitialItems } from './initial-items';
import { Section } from './section';

type ImportBlacklistDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  importBlacklist: (blacklist: string) => void;
};

const ImportBlacklistDialog: React.FC<Readonly<ImportBlacklistDialogProps>> = props => {
  const [domains, setDomains] = React.useState('');
  React.useEffect(() => {
    setDomains('');
  }, [props.open]);
  return (
    <Dialog open={props.open} setOpen={props.setOpen}>
      <div className="ub-row field">
        <h1 className="title">{apis.i18n.getMessage('options_importBlacklistDialog_title')}</h1>
      </div>
      <div className="ub-row field">
        <p className="has-text-grey">
          {apis.i18n.getMessage('options_importBlacklistDialog_helper')}
        </p>
        <p className="has-text-grey">
          {apis.i18n.getMessage('options_blacklistExample', 'example.com')}
        </p>
      </div>
      <div className="ub-row field">
        <div className="control">
          <textarea
            className="textarea has-fixed-size"
            rows={10}
            spellCheck="false"
            value={domains}
            onChange={e => {
              setDomains(e.currentTarget.value);
            }}
          />
        </div>
      </div>
      <div className="ub-row field is-grouped is-grouped-right">
        <div className="control">
          <button
            className="ub-button button has-text-primary"
            onClick={() => {
              props.setOpen(false);
            }}
          >
            {apis.i18n.getMessage('cancelButton')}
          </button>
        </div>
        <div className="control">
          <button
            className="ub-button button is-primary"
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

const SetBlacklist: React.FC = () => {
  const { blacklist: initialBlacklist } = React.useContext(InitialItems);

  const [storedBlacklist, setStoredBlacklist] = React.useState(initialBlacklist);
  const [explicitlyStoredBlacklist, setExplicitlyStoredBlacklist] = React.useState(
    initialBlacklist,
  );
  const [blacklist, setBlacklist] = React.useState(initialBlacklist);
  const [blacklistDirty, setBlacklistDirty] = React.useState(false);
  const [importBlacklistDialogOpen, setImportBlacklistDialogOpen] = React.useState(false);

  const blacklistTextArea = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    return LocalStorage.addChangeListeners({
      blacklist: newBlacklist => {
        if (newBlacklist !== undefined) {
          setStoredBlacklist(newBlacklist);
        }
      },
    });
  }, []);

  return (
    <>
      <div className="ub-row field">
        <p>{apis.i18n.getMessage('options_blacklistLabel')}</p>
        <p
          className="has-text-grey"
          dangerouslySetInnerHTML={{ __html: apis.i18n.getMessage('options_blacklistHelper') }}
        />
        <p className="has-text-grey">
          {apis.i18n.getMessage('options_blacklistExample', '*://*.example.com/*')}
        </p>
        <p className="has-text-grey">
          {apis.i18n.getMessage('options_blacklistExample', '/example\\.(net|org)/')}
        </p>
      </div>
      <div className="ub-row field">
        <div className="control">
          <textarea
            className="textarea has-fixed-size"
            ref={blacklistTextArea}
            rows={10}
            spellCheck={false}
            value={blacklist}
            onChange={e => {
              setBlacklist(e.target.value);
              setBlacklistDirty(true);
            }}
          />
        </div>
        {storedBlacklist !== explicitlyStoredBlacklist && (
          <p className="help">
            {apis.i18n.getMessage('options_blacklistUpdated')}
            &nbsp;
            <span
              className="ub-link-button"
              tabIndex={0}
              onClick={() => {
                setExplicitlyStoredBlacklist(storedBlacklist);
                setBlacklist(storedBlacklist);
                setBlacklistDirty(false);
              }}
            >
              {apis.i18n.getMessage('options_reloadBlacklistButton')}
            </span>
          </p>
        )}
      </div>
      <div className="ub-row field is-grouped is-grouped-right">
        <div className="control">
          <button
            className="ub-button button has-text-primary"
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
                setBlacklistDirty(true);
              }
            }}
          />,
          document.getElementById('importBlacklistDialogRoot')!,
        )}
        <div className="control">
          <button
            className="ub-button button is-primary"
            disabled={!blacklistDirty}
            onClick={() => {
              setStoredBlacklist(blacklist);
              setExplicitlyStoredBlacklist(blacklist);
              setBlacklistDirty(false);
              sendMessage('set-blacklist', blacklist);
            }}
          >
            {apis.i18n.getMessage('options_saveBlacklistButton')}
          </button>
        </div>
      </div>
    </>
  );
};

type RegisterSearchEngineProps = {
  searchEngine: SearchEngine;
};

const RegisterSearchEngine: React.FC<Readonly<RegisterSearchEngineProps>> = props => {
  const [registered, setRegistered] = React.useState(false);
  React.useLayoutEffect(() => {
    (async () => {
      const registered = await apis.permissions.contains({ origins: props.searchEngine.matches });
      setRegistered(registered);
    })();
  }, [props.searchEngine]);
  return (
    <div className="ub-row field is-grouped">
      <div className="control is-expanded">
        <label>{apis.i18n.getMessage(props.searchEngine.messageNames.name)}</label>
      </div>
      <div className="control">
        {registered ? (
          <button className="ub-button button has-text-primary" disabled>
            {apis.i18n.getMessage('options_searchEngineRegistered')}
          </button>
        ) : (
          <button
            className="ub-button button is-primary"
            onClick={async () => {
              const registered = await apis.permissions.request({
                origins: props.searchEngine.matches,
              });
              setRegistered(registered);
              if (registered) {
                sendMessage('register-search-engine', props.searchEngine);
              }
            }}
          >
            {apis.i18n.getMessage('options_registerSearchEngine')}
          </button>
        )}
      </div>
    </div>
  );
};

const RegisterSearchEngines: React.FC = () => {
  return (
    <>
      <p>{apis.i18n.getMessage('options_otherSearchEngines')}</p>
      <p className="has-text-grey">
        {apis.i18n.getMessage('options_otherSearchEnginesDescription')}
      </p>
      <ul className="ub-list">
        {supportedSearchEngines.map(searchEngine => (
          <li className="ub-list-item" key={searchEngine.id}>
            <RegisterSearchEngine searchEngine={searchEngine} />
          </li>
        ))}
      </ul>
    </>
  );
};

type ItemSwitchProps = {
  itemKey: 'skipBlockDialog' | 'hideBlockLinks' | 'hideControl';
  label: string;
};

const ItemSwitch: React.FC<Readonly<ItemSwitchProps>> = props => {
  const { [props.itemKey]: initialItem } = React.useContext(InitialItems);
  const [item, setItem] = React.useState(initialItem);
  return (
    <div className="ub-row field is-grouped">
      <div className="control is-expanded">
        <label htmlFor={props.itemKey}>{props.label}</label>
      </div>
      <div className="control">
        <div className="ub-switch">
          <input
            id={props.itemKey}
            className="switch is-rounded"
            type="checkbox"
            checked={item}
            onChange={e => {
              const value = e.currentTarget.checked;
              setItem(value);
              LocalStorage.store({ [props.itemKey]: value });
            }}
          />
          <label className="label" htmlFor={props.itemKey} />
        </div>
      </div>
    </div>
  );
};

export const GeneralSection: React.FC = () => (
  <Section title={apis.i18n.getMessage('options_generalTitle')}>
    <SetBlacklist />
    <RegisterSearchEngines />
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
