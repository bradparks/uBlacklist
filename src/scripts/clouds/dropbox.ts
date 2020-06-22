import type { Cloud } from '../types';

export const dropbox: Cloud = {
  messageNames: {
    sync: 'clouds_dropboxSync',
    syncDescription: 'clouds_dropboxSyncDescription',
    syncTurnedOn: 'clouds_dropboxSyncTurnedOn',
  },
} as Cloud;
