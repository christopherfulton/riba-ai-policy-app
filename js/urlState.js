/*
 * urlState.js
 * Encodes the form's current answers into the page's own URL (as a hash
 * fragment), so bookmarking the page - or just copying the address bar -
 * captures a snapshot that can be reopened later to carry on where you
 * left off. No file, no server, no database: the URL itself is the save.
 *
 * The hash is kept in sync automatically (debounced) via
 * history.replaceState, which updates the address bar without adding
 * browser-history entries or reloading the page.
 *
 * The uploaded logo is deliberately left out of the link (see
 * EXCLUDED_FIELDS below) - it can be tens of KB as base64, and keeping
 * links short and easy to share/bookmark matters more than the logo
 * surviving a restore. It just needs re-uploading after opening a link.
 */

const UrlState = (function () {
  const HASH_PREFIX = "#s=";
  const MAX_LENGTH = 1500000; // stay comfortably under browser URL limits
  const EXCLUDED_FIELDS = ["logoDataUrl"];
  let debounceTimer = null;
  let warnedAboutSize = false;

  // UTF-8 safe string <-> URL-safe base64 (no padding).
  function encode(state) {
    const toEncode = { ...state };
    EXCLUDED_FIELDS.forEach((field) => delete toEncode[field]);
    const bytes = new TextEncoder().encode(JSON.stringify(toEncode));
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decode(encoded) {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  // Reads any saved progress out of the current URL (e.g. from a
  // bookmark or a pasted link). Returns null if there isn't any, or it
  // can't be read.
  function loadFromUrl() {
    const hash = window.location.hash;
    if (!hash.startsWith(HASH_PREFIX)) return null;
    try {
      return decode(hash.slice(HASH_PREFIX.length));
    } catch (err) {
      console.error("Could not read saved progress from the URL:", err);
      alert(
        "The link's saved progress looks corrupted or incomplete, so it couldn't be loaded. Starting with a blank form instead."
      );
      return null;
    }
  }

  // The actual (non-debounced) work of bringing the address bar's hash
  // up to date with the given state.
  function applyToUrl(state) {
    if (!AppState.isDirty()) {
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      return;
    }
    const encoded = encode(state);
    if (encoded.length > MAX_LENGTH) {
      if (!warnedAboutSize) {
        warnedAboutSize = true;
        alert(
          "Your progress is too large to keep saved in the page's link (this is usually caused by a lot of text in the " +
            "Permitted Use register). PDF/Word export will still work, but bookmarking won't capture everything until this is smaller."
        );
      }
      return;
    }
    warnedAboutSize = false;
    history.replaceState(null, "", HASH_PREFIX + encoded);
  }

  // Debounced - safe to call on every keystroke.
  function syncToUrl(state) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyToUrl(state), 400);
  }

  // Immediate - used right before copying the link, so it's never stale.
  function flushNow(state) {
    clearTimeout(debounceTimer);
    applyToUrl(state);
  }

  return { loadFromUrl, syncToUrl, flushNow };
})();
