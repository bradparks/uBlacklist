import type dayjs from 'dayjs';

export interface Engine {
  id: string;
  name: string;
  matches: string[];
}

export type ISOString = string;

export const enum Interval {
  FiveMinutes = 5,
  FifteenMinutes = 15,
  ThirtyMinutes = 30,
  OneHour = 1 * 60,
  TwoHours = 2 * 60,
  FiveHours = 5 * 60,
}

// #region Result
export interface ErrorResult {
  type: 'error';
  message: string;
}

export interface SuccessResult {
  type: 'success';
  timestamp: ISOString;
}

export type Result = ErrorResult | SuccessResult;
// #endregion Result

// #region CloudStorage
export type CloudStorageId = 'googleDrive';

export interface CloudStorage {
  name: string;
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

export type CloudStorages = Record<CloudStorageId, CloudStorage>;

export interface CloudStorageToken {
  accessToken: string;
  expiresAt: dayjs.Dayjs;
  refreshToken: string;
}
// #endregion CloudStorage

// #region Subscription
export type SubscriptionId = number;

export interface Subscription {
  name: string;
  url: string;
  blacklist: string;
  updateResult: Result | null;
}

export type Subscriptions = Record<SubscriptionId, Subscription>;
// #endregion Subscription
