#!/usr/bin/env node
const EXPECTED = "application/x-apple-aspen-config";
const url = process.argv[2];

if (!url) {
  console.error("Usage: npm run check:mime -- https://example.com/profiles/KTX-WiFi-Secure_wifi08.mobileconfig");
  process.exit(2);
}

const response = await fetch(url, { method: "HEAD", redirect: "follow" });
const contentType = response.headers.get("content-type") || "";

console.log(`URL: ${response.url}`);
console.log(`HTTP: ${response.status}`);
console.log(`Content-Type: ${contentType || "(missing)"}`);

if (!response.ok) {
  process.exit(1);
}

if (!contentType.toLowerCase().startsWith(EXPECTED)) {
  console.error(`Expected Content-Type to start with ${EXPECTED}`);
  process.exit(1);
}
