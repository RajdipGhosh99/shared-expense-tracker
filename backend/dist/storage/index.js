import dotenv from 'dotenv';
dotenv.config();
import { TursoStore } from './TursoStore.js';
let storeInstance = null;
export function getStorage() {
    if (storeInstance)
        return storeInstance;
    const defaultDb = process.env.VERCEL ? 'file:/tmp/local.db' : 'file:local.db';
    const tursoUrl = process.env.TURSO_DATABASE_URL || defaultDb;
    const tursoToken = process.env.TURSO_AUTH_TOKEN;
    if (!process.env.TURSO_DATABASE_URL) {
        console.error('[Storage] Missing TURSO_DATABASE_URL. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel Project Settings.');
    }
    storeInstance = new TursoStore(tursoUrl, tursoToken);
    return storeInstance;
}
//# sourceMappingURL=index.js.map