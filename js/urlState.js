/*
 * urlState.js
 * Encodes the form's current answers into the page's own URL (as a hash
 * fragment), so bookmarking the page - or just copying the address bar -
 * captures a snapshot that can be reopened later to carry on where user
 * left off. 
 * The hash is kept in sync via
 * history.replaceState, which updates the address bar without adding
 * browser-history entries or reloading the page.
 */

const UrlState = (function () {
  const HASH_PREFIX = "#z="; // current scheme: deflate-compressed
  const LEGACY_HASH_PREFIX = "#s="; // old scheme
  const MAX_LENGTH = 1500000; // stay under browser URL limits
  const EXCLUDED_FIELDS = ["logoDataUrl"];
  let debounceTimer = null;
  let warnedAboutSize = false;

  const supportsCompression = typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

  // Uint8Array <-> URL-safe base64 (no padding).
  function bytesToBase64Url(bytes) {
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function base64UrlToBytes(encoded) {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function deflate(bytes) {
    const cs = new CompressionStream("deflate-raw");
    const writer = cs.writable.getWriter();
    writer.write(bytes);
    writer.close();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer());
  }

  async function inflate(bytes) {
    const ds = new DecompressionStream("deflate-raw");
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }

  // Returns the full "#prefix+encoded" hash fragment for the given state.
  async function encode(state) {
    const toEncode = { ...state };
    EXCLUDED_FIELDS.forEach((field) => delete toEncode[field]);
    const jsonBytes = new TextEncoder().encode(JSON.stringify(toEncode));
    if (!supportsCompression) {
      return LEGACY_HASH_PREFIX + bytesToBase64Url(jsonBytes);
    }
    const compressed = await deflate(jsonBytes);
    return HASH_PREFIX + bytesToBase64Url(compressed);
  }

  async function decode(hash) {
    let jsonBytes;
    if (hash.startsWith(HASH_PREFIX)) {
      jsonBytes = await inflate(base64UrlToBytes(hash.slice(HASH_PREFIX.length)));
    } else if (hash.startsWith(LEGACY_HASH_PREFIX)) {
      jsonBytes = base64UrlToBytes(hash.slice(LEGACY_HASH_PREFIX.length));
    } else {
      return null;
    }
    return JSON.parse(new TextDecoder().decode(jsonBytes));
  }

  // Reads any saved progress out of the current URL (e.g. from a
  // bookmark or a pasted link). Returns null if there isn't any, or it
  // can't be read.
  async function loadFromUrl() {
    const hash = window.location.hash;
    if (!hash.startsWith(HASH_PREFIX) && !hash.startsWith(LEGACY_HASH_PREFIX)) return null;
    try {
      return await decode(hash);
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
  async function applyToUrl(state) {
    if (!AppState.isDirty()) {
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      return;
    }
    const hash = await encode(state);
    if (hash.length > MAX_LENGTH) {
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
    history.replaceState(null, "", hash);
  }

  // Debounced - safe to call on every keystroke.
  function syncToUrl(state) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyToUrl(state), 400);
  }

  // Immediate - used right before copying the link
  function flushNow(state) {
    clearTimeout(debounceTimer);
    return applyToUrl(state);
  }

  return { loadFromUrl, syncToUrl, flushNow };
})();
