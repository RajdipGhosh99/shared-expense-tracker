import dotenv from 'dotenv';
dotenv.config();

import { IDataStore } from './IDataStore.js';
import { TursoStore } from './TursoStore.js';

let storeInstance: IDataStore | null = null;

export function getStorage(): IDataStore {
  if (storeInstance) return storeInstance;

  const defaultDb = process.env.VERCEL ? 'file:/tmp/local.db' : 'file:local.db';
  const tursoUrl = process.env.TURSO_DATABASE_URL || defaultDb;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!process.env.TURSO_DATABASE_URL) {
    console.error(
      '[Storage] Missing TURSO_DATABASE_URL. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel Project Settings.',
    );
  }

  storeInstance = new TursoStore(tursoUrl, tursoToken);
  return storeInstance;
}
