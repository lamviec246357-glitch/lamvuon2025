// Service Worker cho PWA - Quan Ly Chi Phi SR2526
// Version cache - tăng số này khi cập nhật app
const CACHE_NAME = 'sr2526-cache-v1';

// Các file cần cache cho offline shell
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ── CÀI ĐẶT: Cache shell files ──
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching shell files');
        return cache.addAll(SHELL_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// ── KÍCH HOẠT: Xóa cache cũ ──
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: Chiến lược Network First với fallback Cache ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Bỏ qua các request đến Google Apps Script (luôn cần mạng)
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('google.com')) {
    return; // Để trình duyệt xử lý bình thường
  }

  // Bỏ qua request không phải GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // Thử lấy từ mạng trước
    fetch(event.request)
      .then(response => {
        // Nếu thành công, lưu vào cache và trả về
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Nếu mạng lỗi, lấy từ cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback cuối cùng: trả về index.html (cho navigation)
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// ── NHẬN TIN NHẮN TỪ APP ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
