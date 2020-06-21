import dayjs from 'dayjs';
import * as LocalStorage from '../local-storage';
import { postMessage } from '../messages';
import type { Interval } from '../types';
import { Mutex, errorResult, successResult } from '../utilities';
import { syncFile } from './cloud-storages';

const mutex = new Mutex();

export async function set(blacklist: string): Promise<void> {
  await mutex.lock(async () => {
    await LocalStorage.store({ blacklist, timestamp: dayjs().toISOString() });
  });
}

export async function sync(): Promise<Interval | null> {
  return await mutex.lock(async () => {
    const { blacklist, timestamp, currentCloudStorageId, syncInterval } = await LocalStorage.load([
      'blacklist',
      'timestamp',
      'currentCloudStorageId',
      'syncInterval',
    ]);
    if (currentCloudStorageId == null) {
      return null;
    }
    postMessage('blacklist-syncing');
    try {
      const syncResult = await syncFile(blacklist, dayjs(timestamp));
      const result = successResult();
      if (syncResult) {
        await LocalStorage.store({
          blacklist: syncResult.content,
          timestamp: syncResult.modifiedTime.toISOString(),
          syncResult: result,
        });
      } else {
        await LocalStorage.store({ syncResult: result });
      }
      postMessage('blacklist-synced', result);
    } catch (e) {
      const result = errorResult(e instanceof Error ? e.message : 'Unknown error');
      await LocalStorage.store({ syncResult: result });
      postMessage('blacklist-synced', result);
    }
    return syncInterval;
  });
}
