self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (!url.pathname.includes("/profiles/") || !url.pathname.endsWith(".mobileconfig")) {
    return;
  }

  event.respondWith(serveMobileconfig(event.request));
});

async function serveMobileconfig(request) {
  const upstream = await fetch(request, { cache: "no-store" });

  if (!upstream.ok) {
    return upstream;
  }

  const body = await upstream.arrayBuffer();
  const fileName = new URL(request.url).pathname.split("/").pop() || "KTX-WiFi-Secure.mobileconfig";
  const headers = new Headers(upstream.headers);

  headers.set("Content-Type", "application/x-apple-aspen-config");
  headers.set("Content-Disposition", `attachment; filename="${fileName}"`);
  headers.set("Cache-Control", "no-store");

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}
