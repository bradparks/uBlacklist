import React from 'react';
import ReactDOM from 'react-dom';
import * as LocalStorage from '../local-storage';
import { lines, unlines } from '../utilities';
import { Section } from './section';
import { Switch } from './switch';
import { Dialog } from './dialog';
import { I18n } from './i18n';
import { InitialItems } from './initial-items';

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
        <h1 className="title">
          <I18n messageName="options_importBlacklistDialog_title" />
        </h1>
      </div>
      <div className="field">
        <p className="help has-text-grey">
          <I18n messageName="options_importBlacklistDialog_helper" />
          <br />
          <I18n messageName="options_blacklistExample" substitutions="example.com" />
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
            <I18n messageName="cancelButton" />
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
            <I18n messageName="options_importBlacklistDialog_importButton" />
          </button>
        </div>
      </div>
    </Dialog>
  );
};

const enum BlacklistStatus {
  Clean,
  Dirty,
  DirtyImport,
}

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
        <p>
          <I18n messageName="options_blacklistLabel" />
        </p>
        <p className="help has-text-grey">
          <I18n messageName="options_blacklistHelper" />
          <br />
          <I18n messageName="options_blacklistExample" substitutions="*://*.example.com/*" />
          <br />
          <I18n messageName="options_blacklistExample" substitutions="/example\.(net|org)/" />
        </p>
      </div>
      <div className="field">
        <div className="control">
          <textarea
            className="textarea has-fixed-size"
            ref={blacklistTextArea}
            rows={10}
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
            <I18n messageName="options_importBlacklistButton" />
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
          document.getElementById('importBlacklistDialog')!,
        )}
        <div className="control">
          <button
            className="button is-primary"
            disabled={blacklistStatus === BlacklistStatus.Clean}
            onClick={() => {
              LocalStorage.store({ blacklist });
              setBlacklistStatus(BlacklistStatus.Clean);
            }}
          >
            <I18n messageName="options_saveBlacklistButton" />
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
  <Section title="options_generalTitle">
    <Blacklist />
    <ItemSwitch itemKey="skipBlockDialog" label="options_skipBlockDialogLabel" />
    <ItemSwitch itemKey="hideBlockLinks" label="options_hideBlockLinksLabel" />
    <ItemSwitch itemKey="hideControl" label="options_hideControlLabel" />
  </Section>
);
