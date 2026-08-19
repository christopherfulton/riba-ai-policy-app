/*
 * feedback.js
 * ------------------------------------------------------------------
 * A small, dismissible feedback prompt shown once a user has actually
 * done something with their policy (bookmarked progress, or exported
 * a PDF/Word doc). 
 * 
 * Where the answers go: this posts directly to a Google Form's
 * response endpoint from the browser. Responses land in that Form's linked
 * Google Sheet.
 *
 * SETUP REQUIRED before this does anything - until FORM_ACTION_URL
 * below is filled in, maybeShow() is a no-op:
 *   1. Create a Google Form (forms.google.com) with three questions,
 *      NONE of them marked "Required" (matches FIELD_ENTRIES below,
 *      any question type is fine since we post plain text):
 *        - "Was this tool useful?"
 *        - "Comments (optional)"
 *        - "Practice name or email (optional)"
 *   2. Responses tab -> Sheets icon -> "Create Spreadsheet", so
 *      submissions land somewhere you can see them.
 *   3. Get the field IDs: on the "..." menu choose "Get pre-filled
 *      link", fill in dummy answers, click "Get link", then copy the
 *      entry.XXXXXXXXX id that appears in the URL for each question
 *      (or view-source the form and search for "entry.").
 *   4. FORM_ACTION_URL is the form's normal URL with "viewform"
 *      swapped for "formResponse", e.g.
 *      https://docs.google.com/forms/d/e/FORM_ID/formResponse
 *   5. Paste the action URL and the three entry IDs in below.
 * ------------------------------------------------------------------
 */

const Feedback = (function () {
  const FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfRB_ujO0idzzSXLSconZNstpF7zoc_FxOXffQKZwrPjdgnFw/formResponse"; // e.g. "https://docs.google.com/forms/d/e/FORM_ID/formResponse"
  const FIELD_ENTRIES = {
    useful: "entry.2046437923", // e.g. "entry.111111111"
    comments: "entry.542820352", // e.g. "entry.222222222"
    contact: "entry.1705807920", // e.g. "entry.333333333"
  };

  const STORAGE_KEY = "aiPolicyFeedbackDone"; // set once submitted or dismissed - never shown again after that
  let shown = false;

  function isConfigured() {
    return Boolean(FORM_ACTION_URL) && Object.values(FIELD_ENTRIES).every(Boolean);
  }

  function alreadyHandled() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (err) {
      return false; // if storage is unavailable, just allow it to show
    }
  }

  function markHandled() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (err) {
      /* ignore - worst case it can show again next visit */
    }
  }

  function submit(usefulValue, commentsValue, contactValue) {
    const body = new URLSearchParams();
    if (usefulValue) body.set(FIELD_ENTRIES.useful, usefulValue);
    if (commentsValue) body.set(FIELD_ENTRIES.comments, commentsValue);
    if (contactValue) body.set(FIELD_ENTRIES.contact, contactValue);

    
    fetch(FORM_ACTION_URL, { method: "POST", mode: "no-cors", body }).catch(() => {
      /* best-effort - if it fails (e.g. offline), we don't retry or bother the user about it */
    });
  }

  // Centred over a dimmed backdrop (like an alert box)
  function buildBanner() {
    const overlay = document.createElement("div");
    overlay.className = "feedback-overlay";

    const el = document.createElement("div");
    el.className = "feedback-banner";
    el.innerHTML = `
      <button type="button" class="feedback-close" aria-label="Dismiss">&times;</button>
      <p class="feedback-title">Quick feedback?</p>
      <p class="feedback-question">Was this policy tool useful for your practice?</p>
      <div class="feedback-useful-options">
        <button type="button" class="feedback-useful" data-value="Yes">Yes</button>
        <button type="button" class="feedback-useful" data-value="Somewhat">Somewhat</button>
        <button type="button" class="feedback-useful" data-value="No">No</button>
      </div>
      <textarea class="feedback-comments" rows="4" placeholder="Anything you'd like to tell us (optional)"></textarea>
      <input type="text" class="feedback-contact" placeholder="Practice name or email (optional - lets us see who's using this)">
      <div class="feedback-actions">
        <button type="button" class="feedback-send" disabled>Send feedback</button>
        <button type="button" class="feedback-skip">No thanks</button>
      </div>
    `;
    overlay.appendChild(el);

    let usefulValue = "";
    const sendBtn = el.querySelector(".feedback-send");

    el.querySelectorAll(".feedback-useful").forEach((btn) => {
      btn.addEventListener("click", () => {
        usefulValue = btn.dataset.value;
        el.querySelectorAll(".feedback-useful").forEach((b) => b.classList.toggle("selected", b === btn));
        sendBtn.disabled = false;
      });
    });

    function dismiss() {
      markHandled();
      overlay.remove();
    }

    // Click on the dimmed backdrop itself (not the box) also dismisses,
    // same as the close/skip buttons.
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) dismiss();
    });

    el.querySelector(".feedback-close").addEventListener("click", dismiss);
    el.querySelector(".feedback-skip").addEventListener("click", dismiss);
    sendBtn.addEventListener("click", () => {
      submit(usefulValue, el.querySelector(".feedback-comments").value.trim(), el.querySelector(".feedback-contact").value.trim());
      el.innerHTML = `<p class="feedback-thanks">Thanks for letting us know!</p>`;
      markHandled();
      setTimeout(() => overlay.remove(), 2500);
    });

    return overlay;
  }

  // Call after a meaningful action (export/bookmark). Shows the banner
  // at most once ever per browser, and only once it's actually
  // configured (see SETUP REQUIRED above).
  function maybeShow() {
    if (shown || !isConfigured() || alreadyHandled()) return;
    shown = true;
    document.body.appendChild(buildBanner());
  }

  return { maybeShow };
})();
