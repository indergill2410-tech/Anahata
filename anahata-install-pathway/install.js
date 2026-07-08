(function () {
  const installButton = document.querySelector("#installButton");
  const openButton = document.querySelector("#openButton");
  const deviceLabel = document.querySelector("#deviceLabel");
  const primaryCopy = document.querySelector("#primaryCopy");
  const installHint = document.querySelector("#installHint");
  const standaloneStatus = document.querySelector("#standaloneStatus");
  const routes = {
    ios: document.querySelector("#iosRoute"),
    android: document.querySelector("#androidRoute"),
    desktop: document.querySelector("#desktopRoute"),
  };

  let deferredPrompt = null;

  const ua = window.navigator.userAgent.toLowerCase();
  const isTouchMac =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;
  const isIOS = /iphone|ipad|ipod/.test(ua) || isTouchMac;
  const isAndroid = /android/.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  function setRoute(routeName) {
    Object.values(routes).forEach((route) => route.classList.remove("is-current"));
    routes[routeName]?.classList.add("is-current");
  }

  function setCopy() {
    if (isStandalone) {
      standaloneStatus.textContent = "Installed";
      deviceLabel.textContent = "Ready";
      primaryCopy.textContent =
        "Anahata is already running from your home screen. You can keep using it here.";
      installHint.textContent = "You are in the installed app experience.";
      openButton.textContent = "Continue";
      return;
    }

    standaloneStatus.textContent = "Not installed";

    if (isIOS) {
      setRoute("ios");
      deviceLabel.textContent = "iPhone detected";
      primaryCopy.textContent =
        "Use Safari to add Anahata to your home screen. iPhone does not allow a web page to trigger this automatically.";
      installHint.textContent =
        "Tap Share in Safari, then choose Add to Home Screen.";
      return;
    }

    if (isAndroid) {
      setRoute("android");
      deviceLabel.textContent = "Android detected";
      primaryCopy.textContent =
        "Use the browser install prompt when it appears. This installs Anahata as a standalone web app.";
      installHint.textContent =
        "If the install button is hidden, open the browser menu and choose Install app.";
      return;
    }

    setRoute("desktop");
    deviceLabel.textContent = "Desktop browser";
    primaryCopy.textContent =
      "Install Anahata from your browser window, then pin it with your everyday tools.";
    installHint.textContent =
      "Look for the install icon in the address bar or browser menu.";
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    if (isIOS) {
      return;
    }

    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
    installHint.textContent = "Ready to install. Tap Install Anahata.";
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installButton.hidden = true;
    standaloneStatus.textContent = "Installed";
    installHint.textContent = "Installed. Open Anahata from your home screen.";
  });

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      installHint.textContent =
        "Open the browser menu and choose Install app or Add to Home screen.";
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;

    if (choice.outcome === "accepted") {
      installHint.textContent = "Installing Anahata.";
    } else {
      installHint.textContent =
        "Install cancelled. You can use the button again after refreshing this page.";
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {
        installHint.textContent =
          "Offline support could not start. The install page still works online.";
      });
    });
  }

  setCopy();
})();
