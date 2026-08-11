/*
 * policyHelpers.js
 * ------------------------------------------------------------------
 * Small utility functions for handling the user's entered answers,
 * shared by policyContent.js (building the policy wording) and
 * render.js (building the input controls). Split out from
 * policyContent.js so that file can stay focused on the policy
 * wording and options themselves.
 * ------------------------------------------------------------------
 */

// Escape user-entered text before dropping it into HTML.
function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function yesNoText(value) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "[Not yet answered]";
}

// Shorthand for "the Responsible Person's name, or a placeholder".
function rp(s) {
  return esc(s.responsiblePerson) || "[Responsible Person]";
}

// Builds a blank data row for a "list" block, based on its entryFields.
function blankRowFor(block) {
  const row = {};
  block.entryFields.forEach((fd) => {
    switch (fd.type) {
      case "checkbox":
        row[fd.key] = false;
        break;
      case "multiOther":
        row[fd.key] = [];
        row[fd.otherKey] = "";
        break;
      case "choiceText":
        row[fd.key] = "";
        row[fd.textKey] = "";
        break;
      default: // text, textarea, yesno
        row[fd.key] = "";
    }
  });
  return row;
}
