#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SSID = "KTX-WiFi-Secure";
const PROFILE_DIR = "profiles";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function monthNumber(value) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 12) {
    throw new Error(`Invalid month "${value}". Use a number from 1 to 12.`);
  }
  return numeric;
}

function monthToken(month) {
  return String(month).padStart(2, "0");
}

function deterministicUuid(seed) {
  const bytes = createHash("sha256").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex").toUpperCase();
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join("-");
}

function buildProfile(month) {
  const mm = monthToken(month);
  const credential = `wifi${mm}`;
  const safeCredential = escapeXml(credential);
  const payloadSeed = `ktx-wifi-secure:${credential}:wifi-payload`;
  const profileSeed = `ktx-wifi-secure:${credential}:configuration-profile`;

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
      <string>${deterministicUuid(payloadSeed)}</string>
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
  <string>${deterministicUuid(profileSeed)}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;
}

function parseArgs(argv) {
  const args = {
    all: false,
    month: new Date().getMonth() + 1,
    outDir: PROFILE_DIR
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all") {
      args.all = true;
    } else if (arg === "--month" || arg === "-m") {
      args.month = monthNumber(argv[index + 1]);
      index += 1;
    } else if (arg === "--out-dir") {
      args.outDir = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument "${arg}".`);
    }
  }

  return args;
}

async function writeProfile(month, outDir) {
  const mm = monthToken(month);
  const fileName = `${SSID}_wifi${mm}.mobileconfig`;
  const target = path.join(outDir, fileName);
  await mkdir(outDir, { recursive: true });
  await writeFile(target, buildProfile(month), "utf8");
  return target;
}

const args = parseArgs(process.argv.slice(2));
const months = args.all ? Array.from({ length: 12 }, (_, index) => index + 1) : [args.month];

for (const month of months) {
  const target = await writeProfile(month, args.outDir);
  console.log(`Generated ${target}`);
}
