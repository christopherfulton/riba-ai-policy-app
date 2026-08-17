/*
 * render.js
 * Builds the row-per-block layout (left = policy text, right = guidance
 * + input control) and keeps the left-hand text in sync with AppState.
 */

const Render = (function () {
  function buildLayout() {
    const container = document.getElementById("app-body");
    container.innerHTML = "";

    POLICY_BLOCKS.forEach((block) => {
      const row = document.createElement("div");
      row.dataset.blockId = block.id;

      if (block.fullWidth) {
        // Spans the whole content width instead of the usual narrow
        // guidance column: input control on top, then a labelled
        // preview of the policy text it produces underneath. This is
        // purely an on-screen layout choice - the exported PDF/Word
        // document is built separately from block.render(state) (see
        // getPolicyHtml() below) and never touches this control markup
        // at all, full-width or not.
        row.className = "row row-full-width";
        row.innerHTML = `
          ${buildGuidanceNote(block)}
          <div class="control" id="control-${block.id}"></div>
          <p class="preview-label">Preview - this is what appears in the exported policy</p>
          <div class="policy-cell${block.pageBreak ? " page-break" : ""}" id="policy-${block.id}"></div>
        `;
      } else {
        row.className = "row";
        const policyCell = document.createElement("div");
        policyCell.className = block.pageBreak ? "policy-cell page-break" : "policy-cell";
        policyCell.id = "policy-" + block.id;

        const guidanceCell = document.createElement("div");
        guidanceCell.className = "guidance-cell";
        guidanceCell.innerHTML = `${buildGuidanceNote(block)}<div class="control" id="control-${block.id}"></div>`;

        row.appendChild(policyCell);
        row.appendChild(guidanceCell);
      }

      container.appendChild(row);
    });

    refreshPolicyText();
  }

  function buildGuidanceNote(block) {
    const title = block.guidanceTitle ? `<p class="guidance-title">${esc(block.guidanceTitle)}</p>` : "";
    const text = block.guidanceText ? `<p class="guidance-text">${block.guidanceText}</p>` : "";
    return `<div class="guidance-note">${title}${text}</div>`;
  }

  // Called once after buildLayout() to wire up interactive controls.
  function wireControls() {
    POLICY_BLOCKS.forEach((block) => {
      const el = document.getElementById("control-" + block.id);
      if (!el) return;

      if (block.type === "text") {
        el.innerHTML = `<label>${esc(block.label)}
          <input type="text" data-field="${block.field}" placeholder="${esc(block.placeholder || "")}">
        </label>`;
        const input = el.querySelector("input");
        input.value = AppState.get()[block.field] || "";
        input.addEventListener("input", () => AppState.set(block.field, input.value));
      }

      if (block.type === "textarea") {
        el.innerHTML = `<label>${esc(block.label)}
          <textarea data-field="${block.field}" rows="4" placeholder="${esc(block.placeholder || "")}"></textarea>
        </label>`;
        const ta = el.querySelector("textarea");
        ta.value = AppState.get()[block.field] || "";
        ta.addEventListener("input", () => AppState.set(block.field, ta.value));
      }

      if (block.type === "choice") {
        el.innerHTML = block.options
          .map(
            (opt) => `<label class="radio-label">
              <input type="radio" name="${block.field}" value="${esc(opt.value)}">
              ${esc(opt.label)}
            </label>`
          )
          .join("");
        el.querySelectorAll("input[type=radio]").forEach((radio) => {
          radio.checked = radio.value === AppState.get()[block.field];
          radio.addEventListener("change", () => AppState.set(block.field, radio.value));
        });
      }

      if (block.type === "multi") {
        el.innerHTML = block.options
          .map(
            (opt) => `<label class="checkbox-label">
              <input type="checkbox" value="${esc(opt.value)}">
              ${esc(opt.label)}
            </label>`
          )
          .join("");
        el.querySelectorAll("input[type=checkbox]").forEach((cb) => {
          cb.checked = (AppState.get()[block.field] || []).includes(cb.value);
          cb.addEventListener("change", () => AppState.toggleArrayValue(block.field, cb.value, cb.checked));
        });
      }

      if (block.type === "checkbox") {
        el.innerHTML = `<label class="checkbox-label"><input type="checkbox"> ${esc(block.label)}</label>`;
        const cb = el.querySelector("input[type=checkbox]");
        cb.checked = !!AppState.get()[block.field];
        cb.addEventListener("change", () => AppState.set(block.field, cb.checked));
      }

      if (block.type === "image") {
        renderImageControl(block, el);
      }

      if (block.type === "choiceText") {
        renderChoiceTextControl(block, el);
      }

      if (block.type === "multiOther") {
        renderMultiOtherControl(block, el);
      }

      if (block.type === "multiWithDetails") {
        renderMultiWithDetailsControl(block, el);
      }

      if (block.type === "list") {
        renderListControl(block, el);
      }
    });
  }

  // Reads an image file chosen by the user and resizes it, entirely in the
  // browser (FileReader + <canvas>), to a fixed height, returning a data:
  // URL. Nothing is uploaded anywhere - the resized image is just a string
  // that lives in AppState alongside every other answer.
  function resizeImageFile(file, targetHeight) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("That file doesn't look like a valid image."));
        img.onload = () => {
          const scale = targetHeight / img.height;
          const targetWidth = Math.max(1, Math.round(img.width * scale));
          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          canvas.getContext("2d").drawImage(img, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL("image/png"));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Logo upload control: a file picker, a small preview of the (already
  // resized) logo, and a way to remove it.
  function renderImageControl(block, el) {
    const dataUrl = AppState.get()[block.field];
    el.innerHTML = `<label>${esc(block.label)}
        <input type="file" accept="image/*" class="image-file-input">
      </label>
      ${
        dataUrl
          ? `<div class="image-preview"><img src="${dataUrl}" alt="Logo preview">
             <button type="button" class="remove-image">Remove logo</button></div>`
          : ""
      }`;

    const fileInput = el.querySelector(".image-file-input");
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        return;
      }
      try {
        const resized = await resizeImageFile(file, block.targetHeight || 150);
        AppState.set(block.field, resized);
        renderImageControl(block, el); // rebuild to show the preview/remove button
      } catch (err) {
        alert(err.message);
      }
    });

    const removeBtn = el.querySelector(".remove-image");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        AppState.set(block.field, "");
        renderImageControl(block, el);
      });
    }
  }

  // Top-level radio-buttons-plus-conditional-text-box control
  // (e.g. "who should hallucinations be reported to?").
  function renderChoiceTextControl(block, el) {
    const state = AppState.get();
    const scope = state[block.field];
    const hideTextFor = block.hideTextFor || [];
    const optionsHtml = block.options
      .map(
        (opt) => `<label class="radio-label">
          <input type="radio" name="${block.field}" value="${esc(opt.value)}" ${scope === opt.value ? "checked" : ""}>
          ${esc(opt.label)}
        </label>`
      )
      .join("");
    const showText = scope && !hideTextFor.includes(scope);
    el.innerHTML = `${optionsHtml}${
      showText
        ? `<input type="text" class="choicetext-input" placeholder="${esc(block.textPlaceholder || "")}" value="${esc(
            state[block.textField] || ""
          )}">`
        : ""
    }`;

    el.querySelectorAll("input[type=radio]").forEach((r) => {
      r.addEventListener("change", () => {
        AppState.set(block.field, r.value);
        renderChoiceTextControl(block, el); // rebuild to show/hide the text box
      });
    });
    const textInput = el.querySelector(".choicetext-input");
    if (textInput) textInput.addEventListener("input", () => AppState.set(block.textField, textInput.value));
  }

  // Top-level checkboxes + an "Other" checkbox that reveals a free-text box
  // (e.g. "how do we guard against cognitive offloading?").
  function renderMultiOtherControl(block, el) {
    const state = AppState.get();
    const selected = state[block.field] || [];
    const otherChecked = selected.includes("other");
    const optionsHtml = block.options
      .map(
        (opt) => `<label class="checkbox-label">
          <input type="checkbox" value="${esc(opt.value)}" ${selected.includes(opt.value) ? "checked" : ""}>
          ${esc(opt.label)}
        </label>`
      )
      .join("");
    el.innerHTML = `${optionsHtml}
      <label class="checkbox-label">
        <input type="checkbox" value="other" ${otherChecked ? "checked" : ""}>
        ${esc(block.otherLabel || "Other")}
      </label>
      ${
        otherChecked
          ? `<input type="text" class="multiother-input" placeholder="${esc(block.otherPlaceholder || "")}" value="${esc(
              state[block.otherField] || ""
            )}">`
          : ""
      }`;

    el.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        AppState.toggleArrayValue(block.field, cb.value, cb.checked);
        renderMultiOtherControl(block, el); // rebuild to show/hide the "Other" text box
      });
    });
    const otherInput = el.querySelector(".multiother-input");
    if (otherInput) otherInput.addEventListener("input", () => AppState.set(block.otherField, otherInput.value));
  }

  // Checkboxes where ticking one reveals its own free-text box
  // (e.g. the ethical dimensions section).
  function renderMultiWithDetailsControl(block, el) {
    const state = AppState.get();
    const selected = state[block.field] || [];
    const details = state[block.detailsField] || {};

    el.innerHTML = block.options
      .map((opt) => {
        const checked = selected.includes(opt.value);
        return `<div class="ethical-option">
          <label class="checkbox-label">
            <input type="checkbox" value="${esc(opt.value)}" ${checked ? "checked" : ""}>
            ${esc(opt.label)}
          </label>
          ${
            checked
              ? `<textarea data-detail-key="${esc(opt.value)}" rows="2" placeholder="${esc(
                  block.detailPlaceholder || ""
                )}">${esc(details[opt.value] || "")}</textarea>`
              : ""
          }
        </div>`;
      })
      .join("");

    el.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        AppState.toggleArrayValue(block.field, cb.value, cb.checked);
        renderMultiWithDetailsControl(block, el); // rebuild to show/hide the detail box
      });
    });
    el.querySelectorAll("textarea[data-detail-key]").forEach((ta) => {
      ta.addEventListener("input", () => AppState.setDetail(block.detailsField, ta.dataset.detailKey, ta.value));
    });
  }

  // ---- Repeatable multi-field entries (e.g. the Permitted Use register) ----

  // Renders the control(s) for ONE field of ONE entry. `namePrefix` -
  // unique per entry (see callers below) - becomes the radio `name`
  // attribute for yesno/choiceText fields, so the browser treats each
  // one as its own mutually-exclusive group instead of leaving every
  // radio on the page ungrouped (which let Yes and No both end up
  // checked at once).
  function entryFieldHtml(fd, row, namePrefix) {
    const val = row[fd.key];
    if (fd.type === "text") {
      return `<label>${esc(fd.label)}
        <input type="text" data-key="${fd.key}" placeholder="${esc(fd.placeholder || "")}" value="${esc(val || "")}">
      </label>`;
    }
    if (fd.type === "textarea") {
      return `<label>${esc(fd.label)}
        <textarea data-key="${fd.key}" rows="2" placeholder="${esc(fd.placeholder || "")}">${esc(val || "")}</textarea>
      </label>`;
    }
    if (fd.type === "checkbox") {
      return `<label class="checkbox-label"><input type="checkbox" data-key="${fd.key}" ${
        val ? "checked" : ""
      }> ${esc(fd.label)}</label>`;
    }
    if (fd.type === "yesno") {
      const name = `${namePrefix}-${fd.key}`;
      return `<div class="field-block"><span class="field-label">${esc(fd.label)}</span>
        <label class="radio-label inline"><input type="radio" name="${name}" data-key="${fd.key}" value="yes" ${
        val === "yes" ? "checked" : ""
      }> Yes</label>
        <label class="radio-label inline"><input type="radio" name="${name}" data-key="${fd.key}" value="no" ${
        val === "no" ? "checked" : ""
      }> No</label>
      </div>`;
    }
    if (fd.type === "multiOther") {
      const selected = row[fd.key] || [];
      const optionsHtml = fd.options
        .map(
          (o) => `<label class="checkbox-label"><input type="checkbox" data-key="${fd.key}" value="${esc(
            o.value
          )}" ${selected.includes(o.value) ? "checked" : ""}> ${esc(o.label)}</label>`
        )
        .join("");
      const otherChecked = selected.includes("other");
      return `<div class="field-block"><span class="field-label">${esc(fd.label)}</span>
        ${optionsHtml}
        <label class="checkbox-label"><input type="checkbox" data-key="${fd.key}" value="other" ${
        otherChecked ? "checked" : ""
      }> Other</label>
        ${
          otherChecked
            ? `<input type="text" class="other-text" data-key="${fd.otherKey}" placeholder="Specify..." value="${esc(
                row[fd.otherKey] || ""
              )}">`
            : ""
        }
      </div>`;
    }
    if (fd.type === "choiceText") {
      const scope = row[fd.key];
      const name = `${namePrefix}-${fd.key}`;
      const optionsHtml = fd.options
        .map(
          (o) => `<label class="radio-label"><input type="radio" name="${name}" data-key="${fd.key}" value="${esc(
            o.value
          )}" ${scope === o.value ? "checked" : ""}> ${esc(o.label)}</label>`
        )
        .join("");
      const showText = scope && !(fd.hideTextFor || []).includes(scope);
      return `<div class="field-block"><span class="field-label">${esc(fd.label)}</span>
        ${optionsHtml}
        ${
          showText
            ? `<input type="text" data-key="${fd.textKey}" placeholder="${esc(fd.textPlaceholder || "")}" value="${esc(
                row[fd.textKey] || ""
              )}">`
            : ""
        }
      </div>`;
    }
    return "";
  }

  // Wires up the control(s) for ONE field of ONE entry. Field types whose
  // markup changes shape when toggled (multiOther, choiceText) rebuild and
  // rewire just their own container, so the rest of the card is untouched.
  function wireEntryField(block, index, fd) {
    const container = document.getElementById(`entry-${block.id}-${index}-${fd.key}`);
    if (!container) return;
    const namePrefix = `${block.id}-${index}`;

    if (fd.type === "text" || fd.type === "textarea") {
      const input = container.querySelector("input, textarea");
      input.addEventListener("input", () => AppState.updateListRow(block.field, index, fd.key, input.value));
    }

    if (fd.type === "checkbox") {
      const cb = container.querySelector("input[type=checkbox]");
      cb.addEventListener("change", () => AppState.updateListRow(block.field, index, fd.key, cb.checked));
    }

    if (fd.type === "yesno") {
      container.querySelectorAll("input[type=radio]").forEach((r) => {
        r.addEventListener("change", () => AppState.updateListRow(block.field, index, fd.key, r.value));
      });
    }

    if (fd.type === "multiOther") {
      const rebuild = () => {
        const row = AppState.get()[block.field][index];
        container.innerHTML = entryFieldHtml(fd, row, namePrefix);
        wireEntryField(block, index, fd);
      };
      container.querySelectorAll('input[type=checkbox][data-key="' + fd.key + '"]').forEach((cb) => {
        cb.addEventListener("change", () => {
          const row = AppState.get()[block.field][index];
          const current = new Set(row[fd.key] || []);
          if (cb.checked) current.add(cb.value);
          else current.delete(cb.value);
          AppState.updateListRow(block.field, index, fd.key, Array.from(current));
          rebuild();
        });
      });
      const otherInput = container.querySelector(".other-text");
      if (otherInput) {
        otherInput.addEventListener("input", () =>
          AppState.updateListRow(block.field, index, fd.otherKey, otherInput.value)
        );
      }
    }

    if (fd.type === "choiceText") {
      const rebuild = () => {
        const row = AppState.get()[block.field][index];
        container.innerHTML = entryFieldHtml(fd, row, namePrefix);
        wireEntryField(block, index, fd);
      };
      container.querySelectorAll("input[type=radio]").forEach((r) => {
        r.addEventListener("change", () => {
          AppState.updateListRow(block.field, index, fd.key, r.value);
          rebuild();
        });
      });
      const textInput = container.querySelector("input[type=text]");
      if (textInput) {
        textInput.addEventListener("input", () =>
          AppState.updateListRow(block.field, index, fd.textKey, textInput.value)
        );
      }
    }
  }

  // Fields whose control needs more than one grid column's worth of
  // room (textareas, and anything built from a set of options) get
  // `entry-field-wide` so they span the full row of the entry-fields
  // grid - see .entry-fields in style.css. Short fields (a single text
  // input, a Yes/No pair) sit side by side instead.
  const WIDE_ENTRY_FIELD_TYPES = ["textarea", "multiOther", "choiceText"];

  function entryCardHtml(block, row, index) {
    const namePrefix = `${block.id}-${index}`;
    const fieldsHtml = block.entryFields
      .map((fd) => {
        const widthClass = WIDE_ENTRY_FIELD_TYPES.includes(fd.type) ? "entry-field-wide" : "entry-field-narrow";
        return `<div class="entry-field ${widthClass}" id="entry-${block.id}-${index}-${fd.key}">${entryFieldHtml(
          fd,
          row,
          namePrefix
        )}</div>`;
      })
      .join("");
    return `<div class="entry-card" data-index="${index}">
      <div class="entry-fields">${fieldsHtml}</div>
      <button type="button" class="remove-row">Remove this entry ✕</button>
    </div>`;
  }

  function renderListControl(block, el) {
    const rows = AppState.get()[block.field] || [];
    el.innerHTML = `<div class="entry-cards">${rows
      .map((row, i) => entryCardHtml(block, row, i))
      .join("")}</div>
      <button type="button" class="add-row">+ Add entry</button>`;

    el.querySelectorAll(".entry-card").forEach((cardEl) => {
      const index = Number(cardEl.dataset.index);
      block.entryFields.forEach((fd) => wireEntryField(block, index, fd));
      cardEl.querySelector(".remove-row").addEventListener("click", () => {
        AppState.removeListRow(block.field, index);
        renderListControl(block, el); // rebuild this control only
      });
    });

    el.querySelector(".add-row").addEventListener("click", () => {
      AppState.addListRow(block.field, blankRowFor(block));
      renderListControl(block, el); // rebuild this control only
    });
  }

  // Re-renders only the left-hand policy wording. Safe to call on
  // every keystroke; never touches the right-hand controls, so focus
  // and cursor position in text inputs are preserved.
  function refreshPolicyText() {
    const state = AppState.get();
    POLICY_BLOCKS.forEach((block) => {
      const cell = document.getElementById("policy-" + block.id);
      if (cell) cell.innerHTML = block.render(state);
    });
  }

  // Returns the assembled policy text (title + all sections) as a
  // standalone HTML string, for use by the PDF / Word export functions.
  function getPolicyHtml() {
    const state = AppState.get();
    var innerHtml = "";
    POLICY_BLOCKS.forEach((block) => {
      innerHtml += "\n"
      innerHtml += `<div class="${block.pageBreak ? "policy-cell page-break" : "policy-cell"}">
        ${block.render(state)}
      </div><br/>`;
    });

    return innerHtml;
    
    //return POLICY_BLOCKS.map((block) => block.render(state)).join("\n");
  }

  return { buildLayout, wireControls, refreshPolicyText, getPolicyHtml };
})();
