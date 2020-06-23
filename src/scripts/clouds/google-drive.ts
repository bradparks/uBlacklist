import Joi from '@hapi/joi';
import dayjs from 'dayjs';
import { apis } from '../apis';
import type { Cloud } from '../types';
import { BadResponse, request, requestJSON, requestText, validate } from '../utilities';

const CLIENT_ID = '304167046827-45h8no7j0s38akv999nivvb7i17ckqeh.apps.googleusercontent.com';
const CLIENT_SECRET = '1QcFpNjHoAf3_XczYwhYicTl';
const FILENAME = 'uBlacklist.txt';
const MULTIPART_RELATED_BOUNDARY = '----------uBlacklistMultipartRelatedBoundaryJMPRhmg2VV4JBuua';

export const googleDrive: Cloud = {
  messageNames: {
    sync: 'clouds_googleDriveSync',
    syncDescription: 'clouds_googleDriveSyncDescription',
    syncTurnedOn: 'clouds_googleDriveSyncTurnedOn',
  },

  hostPermissions: [
    // #if CHROMIUM
    /*
    // #else
    'https://www.googleapis.com/*',
    // #endif
    // #if CHROMIUM
    */
    // #endif
  ],

  // https://developers.google.com/identity/protocols/oauth2/web-server
  async authorize(): Promise<{ authorizationCode: string }> {
    const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authURL.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: apis.identity.getRedirectURL(),
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      access_type: 'offline',
      prompt: 'consent select_account',
    }).toString();
    const redirectURL = new URL(
      await apis.identity.launchWebAuthFlow({
        url: authURL.toString(),
        interactive: true,
      }),
    );
    const error = redirectURL.searchParams.get('error');
    if (error != null) {
      throw new Error(error);
    }
    const code = redirectURL.searchParams.get('code');
    if (code == null) {
      throw new BadResponse();
    } else {
      return { authorizationCode: code };
    }
  },

  async getAccessToken(
    authorizationCode: string,
  ): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }> {
    const response = await requestJSON('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        code: authorizationCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: apis.identity.getRedirectURL(),
        grant_type: 'authorization_code',
      }),
    });
    validate<{ access_token: string; expires_in: number; refresh_token: string }>(
      response,
      Joi.object({
        access_token: Joi.string().required(),
        expires_in: Joi.number().required(),
        refresh_token: Joi.string().required(),
      }),
    );
    return {
      accessToken: response.access_token,
      expiresIn: response.expires_in,
      refreshToken: response.refresh_token,
    };
  },

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await requestJSON('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    validate<{ access_token: string; expires_in: number }>(
      response,
      Joi.object({ access_token: Joi.string().required(), expires_in: Joi.number().required() }),
    );
    return { accessToken: response.access_token, expiresIn: response.expires_in };
  },

  // https://developers.google.com/drive/api/v3/reference/files/list
  // https://developers.google.com/drive/api/v3/appdata
  async findFile(accessToken: string): Promise<{ id: string; modifiedTime: dayjs.Dayjs } | null> {
    const requestURL = new URL('https://www.googleapis.com/drive/v3/files');
    requestURL.search = new URLSearchParams({
      fields: 'files(id, modifiedTime)',
      q: `name = '${FILENAME}'`,
      spaces: 'appDataFolder',
    }).toString();
    const response = await requestJSON(requestURL.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    validate<{ files: { id: string; modifiedTime: string }[] }>(
      response,
      Joi.object({
        files: Joi.array()
          .items(Joi.object({ id: Joi.string(), modifiedTime: Joi.date() }))
          .required(),
      }),
    );
    if (!response.files.length) {
      return null;
    }
    return { id: response.files[0].id, modifiedTime: dayjs(response.files[0].modifiedTime) };
  },

  // https://developers.google.com/drive/api/v3/reference/files/create
  // https://developers.google.com/drive/api/v3/manage-uploads#multipart
  // https://developers.google.com/drive/api/v3/appdata
  async createFile(accessToken: string, content: string, modifiedTime: dayjs.Dayjs): Promise<void> {
    const requestURL = new URL('https://www.googleapis.com/upload/drive/v3/files');
    requestURL.search = new URLSearchParams({ uploadType: 'multipart' }).toString();
    await request(requestURL.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${MULTIPART_RELATED_BOUNDARY}`,
      },
      body: `--${MULTIPART_RELATED_BOUNDARY}\r
Content-Type: application/json; charset=UTF-8\r
\r
{
  "modifiedTime": "${modifiedTime.toISOString()}",
  "name": "${FILENAME}",
  "parents": ["appDataFolder"]
}\r
--${MULTIPART_RELATED_BOUNDARY}\r
Content-Type: text/plain; charset=UTF-8\r
\r
${content}\r
--${MULTIPART_RELATED_BOUNDARY}--`,
    });
  },

  // https://developers.google.com/drive/api/v3/reference/files/get
  // https://developers.google.com/drive/api/v3/manage-downloads
  async readFile(accessToken: string, id: string): Promise<{ content: string }> {
    const requestURL = new URL(`https://www.googleapis.com/drive/v3/files/${id}`);
    requestURL.search = new URLSearchParams({ alt: 'media' }).toString();
    const response = await requestText(requestURL.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { content: response };
  },

  // https://developers.google.com/drive/api/v3/reference/files/update
  // https://developers.google.com/drive/api/v3/manage-uploads#multipart
  async writeFile(
    accessToken: string,
    id: string,
    content: string,
    modifiedTime: dayjs.Dayjs,
  ): Promise<void> {
    const requestURL = new URL(`https://www.googleapis.com/upload/drive/v3/files/${id}`);
    requestURL.search = new URLSearchParams({ uploadType: 'multipart' }).toString();
    await request(requestURL.toString(), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${MULTIPART_RELATED_BOUNDARY}`,
      },
      body: `--${MULTIPART_RELATED_BOUNDARY}\r
Content-Type: application/json; charset=UTF-8\r
\r
{
  "modifiedTime": "${modifiedTime.toISOString()}"
}\r
--${MULTIPART_RELATED_BOUNDARY}\r
Content-Type: text/plain; charset=UTF-8\r
\r
${content}\r
--${MULTIPART_RELATED_BOUNDARY}--`,
    });
  },
};
