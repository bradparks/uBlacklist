import dayjs from 'dayjs';
import { apis } from '../apis';
import { supportedClouds } from '../supported-clouds';
import * as LocalStorage from '../local-storage';
import type { CloudId } from '../types';
import { HTTPError, Mutex } from '../utilities';

const mutex = new Mutex();

export async function connect(id: CloudId): Promise<boolean> {
  return mutex.lock(async () => {
    const { syncCloudId: oldId } = await LocalStorage.load(['syncCloudId']);
    if (oldId != null) {
      throw new Error('Already connected');
    }
    const cloud = supportedClouds[id];
    try {
      const { authorizationCode } = await cloud.authorize();
      const token = await cloud.getAccessToken(authorizationCode);
      await LocalStorage.store({
        syncCloudId: id,
        syncCloudToken: {
          accessToken: token.accessToken,
          expiresAt: dayjs().add(token.expiresIn, 'second'),
          refreshToken: token.refreshToken,
        },
      });
      return true;
    } catch {
      return false;
    }
  });
}

export async function disconnect(): Promise<void> {
  return mutex.lock(async () => {
    const { syncCloudId: id, syncCloudToken: token } = await LocalStorage.load([
      'syncCloudId',
      'syncCloudToken',
    ]);
    if (id == null) {
      throw new Error('Not connected');
    }
    if (token) {
      const cloud = supportedClouds[id];
      try {
        cloud.revokeToken(token.refreshToken);
      } catch {
        // Ignore any exception
      }
    }
    await LocalStorage.store({ syncCloudId: null, syncCloudToken: null });
  });
}

export async function syncFile(
  content: string,
  modifiedTime: dayjs.Dayjs,
): Promise<{ content: string; modifiedTime: dayjs.Dayjs } | null> {
  return await mutex.lock(async () => {
    const { syncCloudId: id, syncCloudToken: token } = await LocalStorage.load([
      'syncCloudId',
      'syncCloudToken',
    ]);
    if (id == null) {
      throw new Error('Not connected');
    }
    const cloud = supportedClouds[id];
    if (token == null) {
      throw new Error(apis.i18n.getMessage('unauthorizedError'));
    }
    const refresh = async (): Promise<void> => {
      try {
        const newToken = await cloud.refreshAccessToken(token.refreshToken);
        token.accessToken = newToken.accessToken;
        token.expiresAt = dayjs().add(newToken.expiresIn, 'second');
        await LocalStorage.store({ syncCloudToken: token });
      } catch (e) {
        if (e instanceof HTTPError && e.status === 400) {
          await LocalStorage.store({ syncCloudToken: null });
          throw new Error(apis.i18n.getMessage('unauthorizedError'));
        } else {
          throw e;
        }
      }
    };
    if (dayjs().isAfter(token.expiresAt)) {
      await refresh();
    }
    const refreshOnUnauthorized = async <T>(f: () => Promise<T>): Promise<T> => {
      try {
        return await f();
      } catch (e) {
        if (e instanceof HTTPError && e.status === 401) {
          await refresh();
          return await f();
        } else {
          throw e;
        }
      }
    };
    const findResult = await refreshOnUnauthorized(() => cloud.findFile(token.accessToken));
    if (findResult) {
      if (modifiedTime.isBefore(findResult.modifiedTime)) {
        const readResult = await refreshOnUnauthorized(() =>
          cloud.readFile(token.accessToken, findResult.id),
        );
        return {
          content: readResult.content,
          modifiedTime: findResult.modifiedTime,
        };
      } else if (modifiedTime.isSame(findResult.modifiedTime)) {
        return null;
      } else {
        await refreshOnUnauthorized(() =>
          cloud.writeFile(token.accessToken, findResult.id, content, modifiedTime),
        );
        return null;
      }
    } else {
      await refreshOnUnauthorized(() => cloud.createFile(token.accessToken, content, modifiedTime));
      return null;
    }
  });
}
