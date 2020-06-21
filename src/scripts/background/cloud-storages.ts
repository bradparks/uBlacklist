import dayjs from 'dayjs';
import { apis } from '../apis';
import { CLOUD_STORAGES } from '../cloud-storages';
import * as LocalStorage from '../local-storage';
import type { CloudStorageId } from '../types';
import { HTTPError, Mutex } from '../utilities';

const mutex = new Mutex();

export async function connect(id: CloudStorageId): Promise<void> {
  return mutex.lock(async () => {
    const { cloudStorageId: oldId } = await LocalStorage.load(['cloudStorageId']);
    if (oldId != null) {
      throw new Error('Already connected');
    }
    const cloudStorage = CLOUD_STORAGES[id];
    const { authorizationCode } = await cloudStorage.authorize();
    const token = await cloudStorage.getAccessToken(authorizationCode);
    await LocalStorage.store({
      cloudStorageId: id,
      cloudStorageToken: {
        accessToken: token.accessToken,
        expiresAt: dayjs().add(token.expiresIn, 'second'),
        refreshToken: token.refreshToken,
      },
    });
  });
}

export async function disconnect(): Promise<void> {
  return mutex.lock(async () => {
    const { cloudStorageId: id, cloudStorageToken: token } = await LocalStorage.load([
      'cloudStorageId',
      'cloudStorageToken',
    ]);
    if (id == null) {
      throw new Error('Not connected');
    }
    if (token) {
      const cloudStorage = CLOUD_STORAGES[id];
      try {
        cloudStorage.revokeToken(token.refreshToken);
      } catch {
        // Ignore any exception
      }
    }
    await LocalStorage.store({ cloudStorageId: null, cloudStorageToken: null });
  });
}

export async function syncFile(
  content: string,
  modifiedTime: dayjs.Dayjs,
): Promise<{ content: string; modifiedTime: dayjs.Dayjs } | null> {
  return await mutex.lock(async () => {
    const { cloudStorageId: id, cloudStorageToken: token } = await LocalStorage.load([
      'cloudStorageId',
      'cloudStorageToken',
    ]);
    if (id == null) {
      throw new Error('Not connected');
    }
    const cloudStorage = CLOUD_STORAGES[id];
    if (token == null) {
      throw new Error(apis.i18n.getMessage('unauthorizedError'));
    }
    const refresh = async (): Promise<void> => {
      try {
        const newToken = await cloudStorage.refreshAccessToken(token.refreshToken);
        token.accessToken = newToken.accessToken;
        token.expiresAt = dayjs().add(newToken.expiresIn, 'second');
        await LocalStorage.store({ cloudStorageToken: token });
      } catch (e) {
        if (e instanceof HTTPError && e.status === 400) {
          await LocalStorage.store({ cloudStorageToken: null });
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
    const findResult = await refreshOnUnauthorized(() => cloudStorage.findFile(token.accessToken));
    if (findResult) {
      if (modifiedTime.isBefore(findResult.modifiedTime)) {
        const readResult = await refreshOnUnauthorized(() =>
          cloudStorage.readFile(token.accessToken, findResult.id),
        );
        return {
          content: readResult.content,
          modifiedTime: findResult.modifiedTime,
        };
      } else if (modifiedTime.isSame(findResult.modifiedTime)) {
        return null;
      } else {
        await refreshOnUnauthorized(() =>
          cloudStorage.writeFile(token.accessToken, findResult.id, content, modifiedTime),
        );
        return null;
      }
    } else {
      await refreshOnUnauthorized(() =>
        cloudStorage.createFile(token.accessToken, content, modifiedTime),
      );
      return null;
    }
  });
}
