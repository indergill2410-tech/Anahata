(function () {
  const installButton = document.querySelector("#installButton");
  const installButtonText = document.querySelector("#installButtonText");
  const copyLinkButton = document.querySelector("#copyLinkButton");
  const deviceLabel = document.querySelector("#deviceLabel");
  const primaryCopy = document.querySelector("#primaryCopy");
  const installHint = document.querySelector("#installHint");
  const standaloneStatus = document.querySelector("#standaloneStatus");
  const installSheet = document.querySelector("#installSheet");
  const sheetBackdrop = document.querySelector("#sheetBackdrop");
  const sheetClose = document.querySelector("#sheetClose");
  const sheetLabel = document.querySelector("#sheetLabel");
  const sheetTitle = document.querySelector("#sheetTitle");
  const sheetCopy = document.querySelector("#sheetCopy");
  const sheetSteps = document.querySelector("#sheetSteps");
  const sheetHint = document.querySelector("#sheetHint");
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
  const isInAppBrowser =
    /fban|fbav|instagram|line|micromessenger|tiktok|twitter|linkedinapp|snapchat|pinterest/.test(
      ua
    );
  const isIOSSafari =
    isIOS &&
    /safari/.test(ua) &&
    !/crios|fxios|edgios|opios|duckduckgo/.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const guides = {
    iosSafari: {
      label: "iPhone",
      title: "Add Anahata to your iPhone",
      copy: "Apple requires this manual Safari step for browser-installed apps.",
      hint: "After Add, Anahata appears on the home screen like an app.",
      steps: [
        "Tap the Share button in Safari.",
        "Scroll and choose Add to Home Screen.",
        "Tap Add.",
        "Open Anahata from the home screen.",
      ],
    },
    iosOther: {
      label: "iPhone",
      title: "Open in Safari first",
      copy: "This browser cannot start the iPhone home-screen install path.",
      hint: "Use Safari, then tap Install Anahata again.",
      steps: [
        "Copy this page link.",
        "Open Safari.",
        "Paste the link and load the page.",
        "Tap Install Anahata, then Add to Home Screen.",
      ],
    },
    androidInApp: {
      label: "Android",
      title: "Open in Chrome first",
      copy: "In-app browsers often block the Android install prompt.",
      hint: "Once this page is open in Chrome, tap Install Anahata again.",
      steps: [
        "Open this page in Chrome, Edge, Brave, or Samsung Internet.",
        "Tap Install Anahata.",
        "Confirm Install when Android shows the prompt.",
      ],
    },
    androidFallback: {
      label: "Android",
      title: "Install from the browser menu",
      copy: "The automatic prompt is not ready yet in this browser session.",
      hint: "If the menu option is missing, refresh once and try again.",
      steps: [
        "Open the browser menu.",
        "Choose Install app or Add to Home screen.",
        "Confirm Install.",
        "Open Anahata from your home screen or app list.",
      ],
    },
    desktop: {
      label: "Desktop",
      title: "Install from the address bar",
      copy: "Desktop browsers show the install control in the address bar or menu.",
      hint: "This creates a standalone Anahata window.",
      steps: [
        "Look for the install icon in the address bar.",
        "Choose Install.",
        "Pin Anahata where you keep daily tools.",
      ],
    },
  };

  function setRoute(routeName) {
    Object.values(routes).forEach((route) => route.classList.remove("is-current"));
    routes[routeName]?.classList.add("is-current");
  }

  function setInstallReady(isReady) {
    installButton.dataset.ready = isReady ? "true" : "false";
  }

  function openGuide(name) {
    const guide = guides[name];
    if (!guide) {
      return;
    }

    sheetLabel.textContent = guide.label;
    sheetTitle.textContent = guide.title;
    sheetCopy.textContent = guide.copy;
    sheetHint.textContent = guide.hint;
    sheetSteps.innerHTML = "";

    guide.steps.forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      sheetSteps.appendChild(item);
    });

    installSheet.hidden = false;
    sheetClose.focus();
  }

  function closeGuide() {
    installSheet.hidden = true;
    installButton.focus();
  }

  function setCopy() {
    if (isStandalone) {
      standaloneStatus.textContent = "Installed";
      deviceLabel.textContent = "Ready";
      primaryCopy.textContent =
        "Anahata is already running from your home screen. You can keep using it here.";
      installHint.textContent = "You are in the installed app experience.";
      installButtonText.textContent = "Open Anahata";
      copyLinkButton.hidden = true;
      return;
    }

    standaloneStatus.textContent = "Not installed";
    installButtonText.textContent = "Install Anahata";

    if (isIOS) {
      setRoute("ios");
      deviceLabel.textContent = "iPhone detected";
      primaryCopy.textContent =
        "Tap Install for the Safari Add to Home Screen path. Apple does not let a normal website auto-install an iPhone app.";
      installHint.textContent = isIOSSafari
        ? "Tap Install Anahata to see the exact Safari steps."
        : "Open this page in Safari to add Anahata to your home screen.";
      return;
    }

    if (isAndroid) {
      setRoute("android");
      deviceLabel.textContent = "Android detected";
      primaryCopy.textContent =
        "Tap Install Anahata. When Android says the app is ready, the browser install prompt opens from this button.";
      installHint.textContent = isInAppBrowser
        ? "Open this link in Chrome first for the install prompt."
        : "Tap Install Anahata. If no prompt appears, the browser menu has the same install option.";
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
    setInstallReady(true);
    installHint.textContent = "Ready to install. Tap Install Anahata.";
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    setInstallReady(false);
    standaloneStatus.textContent = "Installed";
    installHint.textContent = "Installed. Open Anahata from your home screen.";
  });

  installButton.addEventListener("click", async () => {
    if (isStandalone) {
      window.location.href = "./";
      return;
    }

    if (!deferredPrompt) {
      if (isIOS) {
        openGuide(isIOSSafari ? "iosSafari" : "iosOther");
        return;
      }

      if (isAndroid) {
        openGuide(isInAppBrowser ? "androidInApp" : "androidFallback");
        installHint.textContent =
          "The browser did not expose the direct install prompt yet.";
        return;
      }

      openGuide("desktop");
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

  copyLinkButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      installHint.textContent = "Install link copied.";
    } catch (error) {
      installHint.textContent = "Copy this page address from the browser bar.";
    }
  });

  [sheetBackdrop, sheetClose].forEach((control) => {
    control.addEventListener("click", closeGuide);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !installSheet.hidden) {
      closeGuide();
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

  setInstallReady(false);
  setCopy();
})();
