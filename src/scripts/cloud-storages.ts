import { dropbox } from './cloud-storages/dropbox';
import { googleDrive } from './cloud-storages/google-drive';
import type { CloudStorages } from './types';

export const CLOUD_STORAGES: CloudStorages = {
  googleDrive,
  dropbox,
};
