import dayjs from 'dayjs';
import { apis } from './apis';
import { CloudId, CloudToken, Result, SubscriptionId, Subscriptions } from './types';

export interface Items {
  blacklist: string;
  enablePathDepth: boolean;
  hideBlockLinks: boolean;
  hideControl: boolean;
  nextSubscriptionId: SubscriptionId;
  skipBlockDialog: boolean;
  subscriptions: Subscriptions;
  syncCloudId: CloudId | null;
  syncCloudToken: CloudToken | null;
  syncInterval: number;
  syncResult: Result | null;
  timestamp: string;
  updateInterval: number;
}

const defaultItems: Items = {
  blacklist: '',
  enablePathDepth: false,
  hideBlockLinks: false,
  hideControl: false,
  nextSubscriptionId: 0,
  skipBlockDialog: false,
  subscriptions: {},
  syncCloudId: null,
  syncCloudToken: null,
  syncInterval: 5,
  syncResult: null,
  timestamp: dayjs(0).toISOString(),
  updateInterval: 60,
};

export type ItemsFor<T extends (keyof Items)[]> = { [Key in T[number]]: Items[Key] };

export async function load<T extends (keyof Items)[]>(keys: T): Promise<ItemsFor<T>> {
  const defaultItemsForKeys = {} as Record<keyof Items, unknown>;
  for (const key of keys) {
    defaultItemsForKeys[key] = defaultItems[key];
  }
  return (await apis.storage.local.get(defaultItemsForKeys)) as ItemsFor<T>;
}

export async function store<T extends Partial<Items>>(items: T): Promise<void> {
  await apis.storage.local.set(items);
}

export function addListener(listener: (newItems: Partial<Items>) => void): void {
  apis.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }
    const newValues: Record<string, unknown> = {};
    for (const key of Object.keys(changes)) {
      const newValue = changes[key].newValue;
      if (newValue !== undefined) {
        newValues[key] = newValue;
      }
    }
    listener(newValues as Partial<Items>);
  });
}
