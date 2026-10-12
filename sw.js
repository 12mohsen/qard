// خدمة العمل: تجعل التطبيق قابلًا للتثبيت وتفتح واجهته حتى بدون إنترنت.
// البيانات نفسها (Supabase) لا تُخزَّن هنا أبدًا — تأتي دائمًا من الإنترنت.
const V = "loans-v3";
const SHELL = ["./", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;   // لا نلمس Supabase ولا الخطوط
  if (r.mode === "navigate") {
    // الصفحة: الشبكة أولًا ليصل التحديث الجديد، وإلا النسخة المحفوظة
    e.respondWith(fetch(r).then(res => {
      const a = res.clone(), b = res.clone(); caches.open(V).then(c => { c.put(r, a); c.put("./", b); }); return res;
    }).catch(() => caches.match(r).then(h => h || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
