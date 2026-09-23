// オフラインでも起動できるように、アプリ本体をスマホ内にキャッシュする。
// 家計簿のデータ（明細）はここでは扱わない（ブラウザのローカル保存領域にある）。
const CACHE = "kakeibo-v30";   // index.html などを更新したら数字を上げる
const FILES = ["./", "index.html", "manifest.json", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  // ブラウザのキャッシュ（GitHub Pages は10分ためてよいと返す）を通さず、サーバーから取る
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache:"reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// ネットにつながるときは最新版を取りに行き、つながらないときはキャッシュを使う
// cache:"no-cache" で、ブラウザにためてある古い版ではなく、毎回サーバーに確認する（変わっていなければ 304 で軽い）
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, {cache:"no-cache"}).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
