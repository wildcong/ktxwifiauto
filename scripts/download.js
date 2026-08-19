(function () {
  const SSID = "KTX-WiFi-Secure";

  function padMonth(month) {
    return String(month).padStart(2, "0");
  }

  function currentProfilePath() {
    const month = new Date().getMonth() + 1;
    const credential = `wifi${padMonth(month)}`;
    return `profiles/${SSID}_${credential}.mobileconfig`;
  }

  function setManualLink(profilePath) {
    const link = document.getElementById("manual-download-link");
    link.href = profilePath;
    link.setAttribute("download", profilePath.split("/").pop());
  }

  function openProfile(profilePath) {
    window.location.replace(profilePath);
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    try {
      await navigator.serviceWorker.register("service-worker.js");
      await navigator.serviceWorker.ready;
      return Boolean(navigator.serviceWorker.controller);
    } catch (error) {
      console.warn("Service Worker registration failed", error);
      return false;
    }
  }

  async function start() {
    const profilePath = currentProfilePath();
    setManualLink(profilePath);

    const hasController = await registerServiceWorker();
    const url = new URL(window.location.href);

    if (!hasController && !url.searchParams.has("sw")) {
      url.searchParams.set("sw", "ready");
      window.location.replace(url.toString());
      return;
    }

    document.getElementById("download-status").textContent = "다운로드 확인 창이 곧 표시됩니다.";
    window.setTimeout(() => openProfile(profilePath), 250);
  }

  start();
})();
