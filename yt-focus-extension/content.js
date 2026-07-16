
"use strict";

const STYLE_ID = "ytfm-styles";

const SETTINGS_DEFAULTS = {
  blockHome: true,
  blockSidebar: true,
  blockShorts: true,
  blockEndCards: true,
  blockAutoplay: true,
  blockAds: true,
  blockNotifications: true,
  blockComments: true,
  enabled: true,
};

let settings = { ...SETTINGS_DEFAULTS };

// ── Boot ───────────────────────────────────────────────────────────────────
chrome.storage.sync.get(SETTINGS_DEFAULTS, (stored) => {
  settings = { ...SETTINGS_DEFAULTS, ...stored };
  applyStyles();
  watchNavigation();
});

chrome.storage.onChanged.addListener((changes) => {
  for (const [key, { newValue }] of Object.entries(changes)) {
    settings[key] = newValue;
  }
  applyStyles();
});

// ── Re-apply on YouTube SPA navigation ────────────────────────────────────
function watchNavigation() {
  document.addEventListener("yt-navigate-finish", () => {
    applyStyles();
    manageHomePlaceholder();
  });
}

// ── Master switch: inject or remove the <style> tag ───────────────────────
function applyStyles() {
  // Remove existing injected style first
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();

  // Remove placeholder whenever we recalculate
  removePlaceholder();

  if (!settings.enabled) return; // ← disabled: nothing injected, YouTube is untouched

  // Build CSS from current settings
  const css = buildCSS();
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  // Manage placeholder separately (needs DOM to be ready)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", manageHomePlaceholder, { once: true });
  } else {
    manageHomePlaceholder();
  }
}

// ── Build the CSS string based on settings ────────────────────────────────
function buildCSS() {
  let css = "";

  if (settings.blockHome) {
    css += `
      ytd-rich-grid-renderer,
      ytd-browse[page-subtype="home"] ytd-rich-grid-row,
      ytd-browse[page-subtype="home"] #contents.ytd-rich-grid-renderer,
      ytd-feed-filter-chip-bar-renderer { display: none !important; }
    `;
  }

  if (settings.blockSidebar) {
    css += `
      #secondary ytd-watch-next-secondary-results-renderer,
      ytd-compact-video-renderer,
      ytd-compact-autoplay-renderer,
      ytd-compact-radio-renderer,
      ytd-compact-mix-renderer { display: none !important; }
    `;
  }

  if (settings.blockShorts) {
    css += `
      ytd-rich-section-renderer,
      ytd-reel-shelf-renderer,
      [overlay-style="SHORTS"],
      ytd-guide-entry-renderer a[href="/shorts"],
      ytd-mini-guide-entry-renderer a[href="/shorts"] { display: none !important; }
    `;
  }

  if (settings.blockEndCards) {
    css += `
      .ytp-endscreen-content,
      .ytp-cards-button,
      .ytp-cards-teaser { display: none !important; }
    `;
  }

  if (settings.blockAutoplay) {
    css += `.ytp-autonav-toggle-button-container { display: none !important; }`;
  }

  if (settings.blockAds) {
    css += `
      ytd-masthead-ad, ytd-display-ad-renderer, ytd-promoted-video-renderer,
      ytd-search-pyv-renderer, ytd-banner-promo-renderer, #masthead-ad,
      ytd-promoted-sparkles-text-search-renderer,
      .ad-showing .ytp-ad-module, .ad-interrupting .ytp-ad-module { display: none !important; }
    `;
  }

  if (settings.blockNotifications) {
    css += `ytd-notification-topbar-button-renderer { display: none !important; }`;
  }

  if (settings.blockComments) {
    css += `
      ytd-comments, #comments,
      ytd-comment-thread-renderer, #comment-teaser { display: none !important; }
    `;
  }

  // Always-on cosmetic cleanup (not togglable, but only when enabled)
  css += `
    .ytp-watermark { display: none !important; }
    ytd-merch-shelf-renderer { display: none !important; }
  `;

  // Placeholder styling
  css += `
    #ytfm-home-placeholder {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 70vh; gap: 16px;
      color: var(--yt-spec-text-secondary, #aaa);
      font-family: "YouTube Sans", Roboto, sans-serif;
    }
    #ytfm-home-placeholder svg { opacity: 0.25; }
    #ytfm-home-placeholder h2 {
      font-size: 20px; font-weight: 500;
      color: var(--yt-spec-text-primary, #fff); margin: 0;
    }
    #ytfm-home-placeholder p {
      font-size: 14px; margin: 0; max-width: 340px;
      text-align: center; line-height: 1.6;
    }
    #ytfm-home-placeholder .ytfm-hint {
      margin-top: 8px;
      background: var(--yt-spec-badge-chip-background, rgba(255,255,255,0.1));
      border-radius: 20px; padding: 8px 20px; font-size: 14px;
      color: var(--yt-spec-text-secondary, #aaa);
    }
  `;

  return css;
}

// ── Home placeholder ───────────────────────────────────────────────────────
function manageHomePlaceholder() {
  removePlaceholder();
  if (!settings.enabled || !settings.blockHome) return;

  const isHome = location.pathname === "/" || location.pathname === "/feed/subscriptions";
  if (!isHome) return;

  // Retry a few times since YT renders #primary lazily
  let tries = 0;
  const tryInject = () => {
    const primary = document.querySelector('ytd-browse[page-subtype="home"] #primary, ytd-app #primary');
    if (primary && !document.getElementById("ytfm-home-placeholder")) {
      const div = document.createElement("div");
      div.id = "ytfm-home-placeholder";
      div.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect x="8" y="8" width="48" height="48" rx="12" stroke="currentColor" stroke-width="3"/>
          <path d="M26 22l16 10-16 10V22z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
        </svg>
        <h2>Focus Mode is ON</h2>
        <p>Your homepage is hidden. Search for something you actually want to watch.</p>
        <span class="ytfm-hint">🔍 Use the search bar above</span>
      `;
      primary.prepend(div);
    } else if (!primary && tries++ < 10) {
      setTimeout(tryInject, 300);
    }
  };
  tryInject();
}

function removePlaceholder() {
  const el = document.getElementById("ytfm-home-placeholder");
  if (el) el.remove();
}

// ── Ad skip (needs JS, can't be done in CSS) ──────────────────────────────
setInterval(() => {
  if (!settings.enabled || !settings.blockAds) return;
  const skipBtn = document.querySelector(".ytp-ad-skip-button, .ytp-skip-ad-button");
  if (skipBtn) { skipBtn.click(); return; }
  const video = document.querySelector("video");
  const adBadge = document.querySelector(".ad-showing");
  if (video && adBadge && !video.paused && isFinite(video.duration)) {
    video.currentTime = video.duration;
  }
}, 500);
