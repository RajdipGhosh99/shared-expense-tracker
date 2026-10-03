import dotenv from 'dotenv';
dotenv.config();

import { IDataStore } from './IDataStore.js';
import { TursoStore } from './TursoStore.js';
import { GoogleSheetsStore } from './GoogleSheetsStore.js';
import { DualSyncStore } from './DualSyncStore.js';

let storeInstance: IDataStore | null = null;

export function getStorage(): IDataStore {
  if (storeInstance) return storeInstance;

  const mode = process.env.STORAGE_MODE || 'dual';
  const tursoUrl = process.env.TURSO_DATABASE_URL || 'file:local.db';
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const turso = new TursoStore(tursoUrl, tursoToken);
  const sheets = new GoogleSheetsStore({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
  });

  if (mode === 'sheets') {
    storeInstance = sheets;
  } else if (mode === 'turso') {
    storeInstance = turso;
  } else {
    // Default: 'dual'
    storeInstance = new DualSyncStore(turso, sheets);
  }

  return storeInstance!;
}
