import dotenv from 'dotenv';
dotenv.config();

import { IDataStore } from './IDataStore.js';
import { TursoStore } from './TursoStore.js';

let storeInstance: IDataStore | null = null;

export function getStorage(): IDataStore {
  if (storeInstance) return storeInstance;

  const tursoUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  storeInstance = new TursoStore(tursoUrl, tursoToken);
  return storeInstance;
}
