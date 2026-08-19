/*
 * main.js
 * Entry point: builds the page, wires up the header bar, and keeps
 * the left-hand policy text live as the user fills in the right-hand
 * controls.
 * 
 * Progress is "saved" by keeping it encoded in the page's own URL (see
 * urlState.js) - bookmarking the page, or copying the address bar,
 * captures a link that restores everything when opened again.
 */

function isMacPlatform() {
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for contexts where the Clipboard API is unavailable
  // (e.g. some browsers restrict it on file:// pages).
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand("copy");
      ta.remove();
      ok ? resolve() : reject(new Error("execCommand copy failed"));
    } catch (err) {
      ta.remove();
      reject(err);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Restore progress from the URL, if this page was opened from a
  // bookmark/link that has any (must happen before the first render).
  const restored = await UrlState.loadFromUrl();
  if (restored) AppState.loadState(restored);

  Render.buildLayout();
  Render.wireControls();

  // Any change to state -> re-render the policy wording instantly, and
  // keep the address bar's saved-progress link up to date.
  AppState.onChange(() => Render.refreshPolicyText());
  AppState.onChange(() => UrlState.syncToUrl(AppState.get()));

  // --- Header bar actions -------------------------------------------------

  document.getElementById("btn-export-pdf").addEventListener("click", () => {
    PolicyExport.toPdf();
    Feedback.maybeShow();
  });

  document.getElementById("btn-export-word").addEventListener("click", () => {
    PolicyExport.toWord();
    Feedback.maybeShow();
  });

  
  const bookmarkBtn = document.getElementById("btn-bookmark-link");
  bookmarkBtn.addEventListener("click", async () => {
    await UrlState.flushNow(AppState.get()); // make sure the URL isn't stale from the debounce
    if (!AppState.isDirty()) {
      alert("Nothing has been entered yet, so there's no progress to bookmark.");
      return;
    }
    const shortcut = isMacPlatform() ? "Cmd+D" : "Ctrl+D";
    copyTextToClipboard(window.location.href).catch(() => {}); 
    alert(
      `Your progress is saved in this page's address bar.\n\n` +
        `Press ${shortcut} now to bookmark it.\n\n` +
        `(The link has also been copied to your clipboard, if you'd rather paste it somewhere instead.)`
    );
    Feedback.maybeShow();
  });

  
});
