import { apis } from './apis';
import { addMessageListeners } from './messages';
import type { CloudId } from './types';
import * as Blacklist from './background/blacklist';
import * as Clouds from './background/clouds';
import * as SearchEngines from './background/search-engines';
import * as Subscriptions from './background/subscriptions';

const SYNC_BLACKLIST_ALARM_NAME = 'sync-blacklist';
const UPDATE_ALL_SUBSCRIPTIONS_ALARM_NAME = 'update-all-subscriptions';

async function setBlacklist(blacklist: string): Promise<void> {
  await Blacklist.set(blacklist);
  // Don't await sync.
  syncBlacklist();
}

async function syncBlacklist(): Promise<void> {
  const interval = await Blacklist.sync();
  if (interval != null) {
    apis.alarms.create(SYNC_BLACKLIST_ALARM_NAME, { delayInMinutes: interval });
  }
}

async function connectToCloud(id: CloudId): Promise<boolean> {
  const connected = await Clouds.connect(id);
  // Don't await sync.
  syncBlacklist();
  return connected;
}

async function updateAllSubscriptions(): Promise<void> {
  const interval = await Subscriptions.updateAll();
  if (interval != null) {
    apis.alarms.create(UPDATE_ALL_SUBSCRIPTIONS_ALARM_NAME, { delayInMinutes: interval });
  }
}

apis.runtime.onInstalled.addListener(() => {
  syncBlacklist();
  updateAllSubscriptions();
});
apis.runtime.onStartup.addListener(() => {
  syncBlacklist();
  updateAllSubscriptions();
});
apis.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === SYNC_BLACKLIST_ALARM_NAME) {
    syncBlacklist();
  } else if (alarm.name === UPDATE_ALL_SUBSCRIPTIONS_ALARM_NAME) {
    updateAllSubscriptions();
  }
});
addMessageListeners({
  'set-blacklist': setBlacklist,
  'sync-blacklist': syncBlacklist,
  'connect-to-cloud': connectToCloud,
  'disconnect-from-cloud': Clouds.disconnect,
  'add-subscription': Subscriptions.add,
  'register-search-engine': SearchEngines.register,
  'remove-subscription': Subscriptions.remove,
  'update-subscription': Subscriptions.update,
  'update-all-subscriptions': updateAllSubscriptions,
});
SearchEngines.registerAll();
