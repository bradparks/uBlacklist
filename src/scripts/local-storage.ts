import dayjs from 'dayjs';
import { apis } from './apis';
import {
  CloudStorageId,
  CloudStorageToken,
  Interval,
  ISOString,
  Result,
  SubscriptionId,
  Subscriptions,
} from './types';

export interface Items {
  blacklist: string;
  cloudStorageId: CloudStorageId | null;
  cloudStorageToken: CloudStorageToken | null;
  enablePathDepth: boolean;
  hideBlockLinks: boolean;
  hideControl: boolean;
  nextSubscriptionId: SubscriptionId;
  skipBlockDialog: boolean;
  subscriptions: Subscriptions;
  syncInterval: Interval;
  syncResult: Result | null;
  timestamp: ISOString;
  updateInterval: Interval;
}

const defaultItems: Items = {
  blacklist: '',
  cloudStorageId: null,
  cloudStorageToken: null,
  enablePathDepth: false,
  hideBlockLinks: false,
  hideControl: false,
  nextSubscriptionId: 0,
  skipBlockDialog: false,
  subscriptions: {},
  syncInterval: Interval.FiveMinutes,
  syncResult: null,
  timestamp: dayjs(0).toISOString(),
  updateInterval: Interval.OneHour,
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
