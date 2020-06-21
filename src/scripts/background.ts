import { apis } from './apis';
import { addMessageListeners } from './messages';
import type { CloudStorageId } from './types';
import * as Blacklist from './background/blacklist';
import * as CloudStorages from './background/cloud-storages';
import * as Subscriptions from './background/subscriptions';
import { enableOnEngine, enableOnEngines } from './background/engines';

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

async function connectToCloudStorage(id: CloudStorageId): Promise<void> {
  await CloudStorages.connect(id);
  // Don't await sync.
  syncBlacklist();
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
  'connect-to-cloud-storage': connectToCloudStorage,
  'disconnect-from-cloud-storage': CloudStorages.disconnect,
  'add-subscription': Subscriptions.add,
  'enable-on-engine': enableOnEngine,
  'remove-subscription': Subscriptions.remove,
  'update-subscription': Subscriptions.update,
  'update-all-subscriptions': updateAllSubscriptions,
});
enableOnEngines();
