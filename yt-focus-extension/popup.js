// popup.js — YT Focus Mode
"use strict";

const KEYS = [
  "enabled",
  "blockHome",
  "blockSidebar",
  "blockShorts",
  "blockEndCards",
  "blockAutoplay",
  "blockAds",
  "blockNotifications",
  "blockComments",
];

const dot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

// Load settings and populate checkboxes
chrome.storage.sync.get(KEYS, (settings) => {
  KEYS.forEach((key) => {
    const el = document.getElementById(key);
    if (el) el.checked = settings[key] !== false; // default true
  });
  updateStatus(settings.enabled !== false);
  updateDisabledState(settings.enabled !== false);
});

// Save on change
KEYS.forEach((key) => {
  const el = document.getElementById(key);
  if (!el) return;
  el.addEventListener("change", () => {
    const value = el.checked;
    chrome.storage.sync.set({ [key]: value });

    if (key === "enabled") {
      updateStatus(value);
      updateDisabledState(value);
    }

    // Reload the active YT tab so changes apply immediately
    reloadYouTubeTab();
  });
});

function updateStatus(enabled) {
  if (enabled) {
    dot.classList.add("on");
    statusText.textContent = "Focus Mode active";
  } else {
    dot.classList.remove("on");
    statusText.textContent = "Focus Mode paused";
  }
}

function updateDisabledState(enabled) {
  document.body.classList.toggle("disabled", !enabled);
}

function reloadYouTubeTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url && tab.url.includes("youtube.com")) {
      chrome.tabs.reload(tab.id);
    }
  });
}
