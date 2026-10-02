import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('backend/.env') });

import { GoogleSheetsStore } from '../storage/GoogleSheetsStore.js';

async function main() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  console.log('📊 Connecting to Google Spreadsheet ID:', spreadsheetId);
  console.log('🤖 Using Service Account:', clientEmail);

  const store = new GoogleSheetsStore({
    spreadsheetId,
    clientEmail,
    privateKey,
  });

  console.log('🛠️ Initializing and provisioning tabs (Flats, Flat_Members, Expenses, Settlements, Monthly_Archives)...');
  await store.init();
  console.log('✅ Tabs and headers successfully initialized on your Google Sheet!');

  // Test reading flats tab
  const flats = await store.getAllFlats();
  console.log('📋 Current flats count in Google Sheet:', flats.length);

  console.log('🎉 Live Google Sheet integration is 100% verified and operational!');
}

main().catch((err) => {
  console.error('❌ Google Sheet verification failed:', err);
  process.exit(1);
});
