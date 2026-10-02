// Custom Service Worker for Web Share Target interception
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const receiptFile = formData.get('receipt');

          if (receiptFile) {
            const db = await openShareDB();
            await saveReceiptToDB(db, receiptFile);
          }
        } catch (err) {
          console.error('[SW] Error caching shared screenshot:', err);
        }

        // Redirect to screenshot review screen
        return Response.redirect('/screenshot-review', 303);
      })(),
    );
  }
});

function openShareDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('group_share_cache', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('shares');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveReceiptToDB(db, file) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shares', 'readwrite');
    tx.objectStore('shares').put(file, 'latest-screenshot');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
