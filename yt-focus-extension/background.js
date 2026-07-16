// background.js — YT Focus Mode service worker
// Handles extension install and icon badge

chrome.runtime.onInstalled.addListener(() => {
  // Set defaults on first install
  chrome.storage.sync.set({
    blockHome: true,
    blockSidebar: true,
    blockShorts: true,
    blockEndCards: true,
    blockAutoplay: true,
    blockAds: true,
    blockNotifications: true,
    blockComments: false,
    enabled: true,
  });
});
