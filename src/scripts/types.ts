import type dayjs from 'dayjs';

export interface ErrorResult {
  type: 'error';
  message: string;
}

export interface SuccessResult {
  type: 'success';
  timestamp: string;
}

export type Result = ErrorResult | SuccessResult;

// #region Clouds
export type CloudId = 'googleDrive' | 'dropbox';

export interface Cloud {
  messageNames: { sync: string; syncDescription: string; syncTurnedOn: string };
  hostPermissions: string[];
  authorize(): Promise<{ authorizationCode: string }>;
  getAccessToken(
    authorizationCode: string,
  ): Promise<{ accessToken: string; expiresIn: number; refreshToken: string }>;
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }>;
  revokeToken(token: string): Promise<void>;
  findFile(accessToken: string): Promise<{ id: string; modifiedTime: dayjs.Dayjs } | null>;
  createFile(accessToken: string, content: string, modifiedTime: dayjs.Dayjs): Promise<void>;
  readFile(accessToken: string, id: string): Promise<{ content: string }>;
  writeFile(
    accessToken: string,
    id: string,
    content: string,
    modifiedTime: dayjs.Dayjs,
  ): Promise<void>;
}

export type Clouds = Record<CloudId, Cloud>;

export interface CloudToken {
  accessToken: string;
  expiresAt: dayjs.Dayjs;
  refreshToken: string;
}
// #endregion Clouds

// #region SearchEngines
export interface SearchEngine {
  id: string;
  messageNames: { name: string };
  matches: string[];
}

export type SearchEngines = SearchEngine[];
// #endregion SearchEngines

// #region Subscriptions
export type SubscriptionId = number;

export interface Subscription {
  name: string;
  url: string;
  blacklist: string;
  updateResult: Result | null;
}

export type Subscriptions = Record<SubscriptionId, Subscription>;
// #endregion Subscriptions
