import Joi from '@hapi/joi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { Cloud } from '../types';
import { HTTPError } from '../utilities';
import * as Helpers from './helpers';

dayjs.extend(utc);

const APP_KEY = 'kgkleqa3m2hxwqu';
const APP_SECRET = 'p5it3m3oxqqcaw8';
const FILEPATH = '/uBlacklist.txt';

function toISOStringSecond(time: dayjs.Dayjs): string {
  return time.utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
}

export const dropbox: Cloud = {
  hostPermissions: [],
  messageNames: {
    sync: 'clouds_dropboxSync',
    syncDescription: 'clouds_dropboxSyncDescription',
    syncTurnedOn: 'clouds_dropboxSyncTurnedOn',
  },
  modifiedTimePrecision: 'second',

  // https://www.dropbox.com/developers/documentation/http/documentation
  authorize: Helpers.authorize('https://www.dropbox.com/oauth2/authorize', {
    client_id: APP_KEY,
    token_access_type: 'offline',
    force_reapprove: 'true',
  }),
  getAccessToken: Helpers.getAccessToken('https://api.dropboxapi.com/oauth2/token', {
    client_id: APP_KEY,
    client_secret: APP_SECRET,
  }),
  refreshAccessToken: Helpers.refreshAccessToken('https://api.dropboxapi.com/oauth2/token', {
    client_id: APP_KEY,
    client_secret: APP_SECRET,
  }),

  // https://www.dropbox.com/developers/documentation/http/documentation#files-upload
  async createFile(accessToken: string, content: string, modifiedTime: dayjs.Dayjs): Promise<void> {
    const urlBuilder = new URL('https://content.dropboxapi.com/2/files/upload');
    urlBuilder.search = new URLSearchParams({
      authorization: `Bearer ${accessToken}`,
      arg: JSON.stringify({
        path: FILEPATH,
        mode: 'add',
        autorename: false,
        client_modified: toISOStringSecond(modifiedTime),
        mute: true,
        strict_conflict: false,
      }),
    }).toString();
    const response = await fetch(urlBuilder.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=dropbox-cors-hack',
      },
      body: content,
    });
    if (response.ok) {
      return;
    } else {
      throw new HTTPError(response.status, response.statusText);
    }
  },

  // https://www.dropbox.com/developers/documentation/http/documentation#files-get_metadata
  async findFile(accessToken: string): Promise<{ id: string; modifiedTime: dayjs.Dayjs } | null> {
    const urlBuilder = new URL('https://api.dropboxapi.com/2/files/get_metadata');
    urlBuilder.search = new URLSearchParams({
      authorization: `Bearer ${accessToken}`,
    }).toString();
    const response = await fetch(urlBuilder.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=dropbox-cors-hack',
      },
      body: JSON.stringify({
        path: FILEPATH,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
      }),
    });
    if (response.ok) {
      const responseBody = await response.json();
      Helpers.validate<{ id: string; client_modified: string }>(
        responseBody,
        Joi.object({ id: Joi.string().required(), client_modified: Joi.date().iso().required() }),
      );
      return { id: responseBody.id, modifiedTime: dayjs(responseBody.client_modified) };
    } else if (response.status === 409) {
      const responseBody = await response.json();
      Helpers.validate<{ error: { '.tag': 'path'; path: { '.tag': string } } }>(
        responseBody,
        Joi.object({
          error: Joi.object({ '.tag': Joi.string().valid('path'), path: { '.tag': Joi.string() } }),
        }),
      );
      if (responseBody.error.path['.tag'] === 'not_found') {
        return null;
      } else {
        throw new Error(responseBody.error['.tag']);
      }
    } else {
      throw new HTTPError(response.status, response.statusText);
    }
  },

  // https://www.dropbox.com/developers/documentation/http/documentation#files-download
  async readFile(accessToken: string, id: string): Promise<{ content: string }> {
    const urlBuilder = new URL('https://content.dropboxapi.com/2/files/download');
    urlBuilder.search = new URLSearchParams({
      authorization: `Bearer ${accessToken}`,
      arg: JSON.stringify({
        path: id,
      }),
    }).toString();
    const response = await fetch(urlBuilder.toString(), {
      method: 'POST',
    });
    if (response.ok) {
      const responseBody = await response.text();
      return { content: responseBody };
    } else {
      throw new HTTPError(response.status, response.statusText);
    }
  },

  // https://www.dropbox.com/developers/documentation/http/documentation#files-upload
  async writeFile(
    accessToken: string,
    id: string,
    content: string,
    modifiedTime: dayjs.Dayjs,
  ): Promise<void> {
    const urlBuilder = new URL('https://content.dropboxapi.com/2/files/upload');
    urlBuilder.search = new URLSearchParams({
      authorization: `Bearer ${accessToken}`,
      arg: JSON.stringify({
        path: id,
        mode: 'overwrite',
        autorename: false,
        client_modified: toISOStringSecond(modifiedTime),
        mute: true,
        strict_conflict: false,
      }),
    }).toString();
    const response = await fetch(urlBuilder.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=dropbox-cors-hack',
      },
      body: content,
    });
    if (response.ok) {
      return;
    } else {
      throw new HTTPError(response.status, response.statusText);
    }
  },
};
