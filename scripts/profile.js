(function () {
  const SSID = "KTX-WiFi-Secure";

  function padMonth(month) {
    return String(month).padStart(2, "0");
  }

  function hashBytes(value) {
    const encoder = new TextEncoder();
    return crypto.subtle.digest("SHA-256", encoder.encode(value));
  }

  async function deterministicUuid(seed) {
    const digest = new Uint8Array(await hashBytes(seed));
    const bytes = digest.slice(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20)
    ].join("-");
  }

  function escapeXml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }

  async function buildProfile(month) {
    const mm = padMonth(month);
    const credential = `wifi${mm}`;
    const safeCredential = escapeXml(credential);
    const payloadUuid = await deterministicUuid(`ktx-wifi-secure:${credential}:wifi-payload`);
    const profileUuid = await deterministicUuid(`ktx-wifi-secure:${credential}:configuration-profile`);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>AutoJoin</key>
      <true/>
      <key>EAPClientConfiguration</key>
      <dict>
        <key>AcceptEAPTypes</key>
        <array>
          <integer>25</integer>
        </array>
        <key>UserName</key>
        <string>${safeCredential}</string>
        <key>UserPassword</key>
        <string>${safeCredential}</string>
      </dict>
      <key>EncryptionType</key>
      <string>WPA</string>
      <key>PayloadDisplayName</key>
      <string>${SSID}</string>
      <key>PayloadIdentifier</key>
      <string>dev.wildcong.ktxwifiauto.${safeCredential}.wifi</string>
      <key>PayloadType</key>
      <string>com.apple.wifi.managed</string>
      <key>PayloadUUID</key>
      <string>${payloadUuid}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>SSID_STR</key>
      <string>${SSID}</string>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>${SSID} ${month}월 Wi-Fi 프로파일 (PEAP, ${safeCredential}/${safeCredential})</string>
  <key>PayloadDisplayName</key>
  <string>${SSID} (${safeCredential})</string>
  <key>PayloadIdentifier</key>
  <string>dev.wildcong.ktxwifiauto.${safeCredential}.profile</string>
  <key>PayloadOrganization</key>
  <string>wildcong</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${profileUuid}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;
  }

  function download(content, fileName) {
    const blob = new Blob([content], { type: "application/x-apple-aspen-config;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register("service-worker.js");
      await navigator.serviceWorker.ready;

      if (!navigator.serviceWorker.controller) {
        const reloadUrl = new URL(window.location.href);
        if (!reloadUrl.searchParams.has("sw")) {
          reloadUrl.searchParams.set("sw", "ready");
          window.location.replace(reloadUrl.toString());
        }
        return false;
      }

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      return true;
    } catch (error) {
      console.warn("Service Worker registration failed", error);
      return false;
    }
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const mm = padMonth(month);
  const credential = `wifi${mm}`;
  const fileName = `${SSID}_${credential}.mobileconfig`;

  document.getElementById("month-badge").textContent = `${month}월 프로파일`;
  document.getElementById("credential-inline").textContent = credential;
  document.getElementById("username-value").textContent = credential;
  document.getElementById("password-value").textContent = credential;
  document.getElementById("install-link").href = `profiles/${fileName}`;
  document.getElementById("install-link").setAttribute("download", fileName);

  document.getElementById("generate-button").addEventListener("click", async () => {
    const profile = await buildProfile(month);
    download(profile, fileName);
  });

  registerServiceWorker().then((isReady) => {
    const badge = document.getElementById("month-badge");
    badge.textContent = isReady ? `${month}월 프로파일 준비됨` : `${month}월 프로파일`;
  });
})();
