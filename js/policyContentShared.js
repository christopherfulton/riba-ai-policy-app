/*
 * policyContentShared.js
 * ------------------------------------------------------------------
 * Building blocks, option lists and helpers shared by both policy
 * builders:
 *   - js/policyContent.js     (the full template, "Template Policy.docx")
 *   - js/policyContentLite.js (the simplified template, "Template
 *                              Policy LITE.docx", linked to Practice
 *                              Profile 1)
 *
 * What belongs here vs. what doesn't: only things that are genuinely
 * identical in both source documents (or are this app's own UI text,
 * not drawn from either document) belong in this file. Where the two
 * documents say something similar but not word-for-word identical,
 * that wording stays in each template's own content file - see the
 * comment at the top of policyContent.js for why that fidelity
 * matters. Sharing here is about not duplicating *logic* (option
 * lists, field definitions, render helpers) and the handful of
 * passages that truly are identical, not about forcing the two
 * policies to read the same.
 *
 * Loaded after policyHelpers.js (esc/rp/yesNoText/blankRowFor) and
 * before policyContent.js / policyContentLite.js.
 * ------------------------------------------------------------------
 */

// small helper used by both templates' "choose a clause" blocks
function PICK(options, value) {
  return options.find((o) => o.value === value);
}

// ------------------------------------------------------------------
// Permitted Use register
// ------------------------------------------------------------------

const PERMITTED_USE_TYPE_OPTIONS = [
  { value: "ml", label: "Machine Learning" },
  { value: "dl", label: "Deep Learning" },
  { value: "optimisation", label: "Mathematical Optimisation" },
  { value: "llm", label: "LLM" },
  { value: "genImage", label: "Generative Image" },
  { value: "genVideo", label: "Generative Video" },
  { value: "gen3d", label: "Generative 3D" },
  { value: "agent", label: "Agent/Harness" },
];

// The fields that make up ONE entry in the Permitted Use register.
// Both templates collect the same core fields; only the full template
// additionally asks for a "Type" (see PERMITTED_USE_TYPE_OPTIONS) -
// the simplified template's table in "Template Policy LITE.docx"
// doesn't have that column.
function buildPermittedUseFields({ includeType }) {
  const fields = [
    { type: "text", key: "name", label: "Name of AI tool/model/service", placeholder: "e.g. ChatGPT Enterprise" },
  ];
  if (includeType) {
    fields.push({
      type: "multiOther",
      key: "types",
      otherKey: "typeOther",
      label: "Type",
      options: PERMITTED_USE_TYPE_OPTIONS,
    });
  }
  fields.push(
    {
      type: "textarea",
      key: "problemStatement",
      label: "Problem this solves",
      placeholder: `What problem does it solve?
Has this been demonstrated to work reliably in robust testing/evaluation?`,
    },
    { type: "textarea", 
      key: "risks", 
      label: "Risks", 
      placeholder: "What are the known risks associated with its use?" },
    {
      type: "choiceText",
      key: "permittedUserScope",
      textKey: "permittedUserNames",
      label: "Permitted User(s)",
      textPlaceholder: "Enter the specific name(s) or group name(s)",
      hideTextFor: ["whole"],
      options: [
        { value: "specific", label: "Specific people" },
        { value: "group", label: "Groups/subsets of the practice" },
        { value: "whole", label: "Whole practice" },
      ],
    },
    { type: "textarea", key: "examplesDo", label: "Example(s) of Permitted Use", placeholder: "Do:" },
    { type: "textarea", key: "examplesDont", label: "Example(s) of misuse/non-permitted use", placeholder: "Don't:" },
    {
      type: "text",
      key: "tosLocation",
      label: "A copy of Terms of Service are stored here",
      placeholder: "Insert file path or intranet link here",
    },
    {
      type: "yesno",
      key: "tosCoverage",
      label: "Do these give the practice required data protection, copyright indemnity, and other coverage?",
    },
    { type: "yesno", key: "piInsurance", label: "If used in project delivery, confirm that use is covered by PI insurance" },
    {
      type: "yesno",
      key: "roiMethod",
      label: "Do you have a method for quantifying Return on Investment or overall value to the practice?",
    }
  );
  return fields;
}

// Renders one completed Permitted Use entry as it appears in the
// exported policy text. `includeType` must match whatever was passed
// to buildPermittedUseFields() for the same register.
// DOs are coloured dark green, DON'Ts dark red - inline styles rather
// than a CSS class, since the Word export wraps this exact HTML with
// no stylesheet of its own (see export.js), so a class wouldn't survive
// into the exported .doc. Inline styles render correctly in the
// on-screen preview, the PDF export and the Word export alike.
function permittedUseEntryHtml(row, { includeType } = {}) {
  const scopeOption = { specific: "Specific people", group: "Groups/subsets of the practice", whole: "Whole practice" }[
    row.permittedUserScope
  ];

  let typeRow = "";
  if (includeType) {
    const typeLabels = PERMITTED_USE_TYPE_OPTIONS.filter((o) => (row.types || []).includes(o.value)).map(
      (o) => o.label
    );
    if ((row.types || []).includes("other") && row.typeOther) typeLabels.push(esc(row.typeOther));
    typeRow = `<tr>
        <th>Type</th>
        <td colspan="3">${typeLabels.length ? esc(typeLabels.join(", ")) : "[Not specified]"}</td>
      </tr>`;
  }

  return `<div class="permitted-entry">
    <h3>${esc(row.name) || "[Unnamed tool]"}</h3>
    <table class="permitted-entry-table">
    <tbody>
      <tr>
        <th>Permitted User(s)</th>
        <td colspan="3">${scopeOption ? esc(scopeOption) : "[Not specified]"}${
    row.permittedUserScope && row.permittedUserScope !== "whole" && row.permittedUserNames
      ? `: ${esc(row.permittedUserNames)}`
      : ""
  }</td>
      </tr>
      ${typeRow}
      <tr>
        <th>Problem this solves</th>
        <td colspan="3"> ${esc(row.problemStatement) || "[Not specified]"}</td>
      </tr>
      <tr>
        <th>Risks</th>
        <td colspan="3"> ${esc(row.risks) || "[Not specified]"}</td>
      </tr>
      <tr>
        <th>Example(s) of Permitted Use (DOs)</th>
        <td colspan="3" style="color: darkgreen;"> ${esc(row.examplesDo) || "[Not specified]"}</td>
      </tr>
      <tr>
        <th>Example(s) of misuse/non-permitted use (DON'Ts)</th>
        <td colspan="3" style="color: darkred;"> ${esc(row.examplesDont) || "[Not specified]"}</td>
      </tr>
      <tr>
        <th colspan="1">A copy of Terms of Service are stored at</th>
        <td colspan="3"> ${esc(row.tosLocation) || "[Not specified]"}</td>
      </tr>
      <tr>
        <th colspan="2">Do these ToS give the practice required data protection, copyright indemnity, and other coverage?</th>
        <td colspan="2"> ${yesNoText(row.tosCoverage)}</td>
      </tr>
      <tr>
        <th colspan="2">If used in project delivery, confirm that use is covered by PI insurance</th>
        <td colspan="2"> ${yesNoText(row.piInsurance)}</td>
      </tr>
      <tr>
        <th colspan="2">Do you have a method for quantifying Return on Investment or overall value to the practice?</th>
        <td colspan="2"> ${yesNoText(row.roiMethod)}</td>
      </tr>
    </tbody>
    </table>
  </div>`;
}

// The Permitted Use register block itself - identical shape and
// wording in both templates, parameterized only by whether this
// template's register includes the "Type" field (see
// buildPermittedUseFields() above). Marked `fullWidth: true` so
// render.js gives it the whole content width instead of the narrow
// guidance column every other block uses - the register's entry
// cards and preview table both need the extra room. See render.js's
// buildLayout() for how that flag changes the on-screen layout; it
// has no effect on the exported PDF/Word document, which is built
// straight from render(state) regardless of on-screen layout.
function permittedUsesBlock({ includeType }) {
  return {
    id: "permittedUses",
    type: "list",
    field: "permittedUses",
    fullWidth: true,
    entryFields: buildPermittedUseFields({ includeType }),
    guidanceTitle: "Permitted Use register",
    guidanceText: "Add one entry per approved AI service, tool, or model.",
    render: (s) => {
      const rows = (s.permittedUses || []).filter((r) => r.name && r.name.trim());
      return rows.length
        ? rows.map((row) => permittedUseEntryHtml(row, { includeType })).join("")
        : "<p><em>No generative AI services are permitted for use</em></p>";
    },
  };
}

// Guidance copy shown next to the Permitted Use register intro. This
// is the app's own advice to whoever's filling the form in (drawn from
// a yellow "author's note" box that appears in both source documents,
// worded near-identically) rather than operative policy wording, so
// it's fine for both templates to show the same text.
function permittedUseIntroGuidance() {
  return `If no generative AI technologies' benefits are considered to outweigh their risks,
      or all are ruled out by ethical or other concerns, then the register below might be simply left blank.
      <br/><br/>
      This effectively says "we don't approve any generative AI services or tools for use in our practice".
      <br/><br/>
      However, with the prevalence of generative AI services embedded in everything from web search to email clients,
      you may find enforcing a total ban on generative AI use very difficult in practice, and it's possible that some staff may decide to
      use personal accounts outside of your control or oversight.
      <br/><br/>
      At a minimum, it would be wise to include services such as Google's built-in "AI-mode" web search summary, and basic included generative AI features
      such as CoPilot in Microsoft 365, or Gemini in Google Workspace, if these are used in your practice.
      `;
}

// ------------------------------------------------------------------
// "Who should this be reported/referred to?" - used for hallucination
// reporting in both templates, and also for "who to contact about
// Permitted Use changes" in the full template.
// ------------------------------------------------------------------

const REPORT_CHANNEL_OPTIONS = [
  { value: "responsiblePerson", label: "Responsible Person" },
  { value: "team", label: "Specific internal team" },
  { value: "itHelpdesk", label: "IT Helpdesk" },
  { value: "other", label: "Other" },
];

// Resolves a choiceText field built from REPORT_CHANNEL_OPTIONS down to
// the text that should actually be printed in the policy: the
// Responsible Person's name, a fixed phrase, the free-text detail the
// user typed in, or a "not yet specified" placeholder.
function resolveChannelText(s, channelField, textField) {
  const opt = PICK(REPORT_CHANNEL_OPTIONS, s[channelField]);
  if (!opt) return "[Not yet selected]";
  if (opt.value === "responsiblePerson") return rp(s);
  if (opt.value === "itHelpdesk") return "the IT Helpdesk";
  return s[textField] ? esc(s[textField]) : `[${opt.label} - not yet specified]`;
}

// ------------------------------------------------------------------
// Shared header blocks: logo / title page / practice name / date /
// responsible person. Identical UI, identical wording, in both
// templates - the two documents don't disagree on any of this, it's
// entirely this app's own scaffolding around whichever policy wording
// follows.
// ------------------------------------------------------------------

function logoBlock() {
  return {
    id: "logo",
    type: "image",
    field: "logoDataUrl",
    label: "Practice logo (optional)",
    guidanceTitle: "Practice logo",
    guidanceText:
      `Upload an image from your computer. It stays entirely in your browser and is automatically resized to 75px tall.
      <br/>Note: the logo is not included in the "Bookmark your progress" link - it will need to be re-uploaded after opening a bookmarked/pasted link.
      `,
    render: (s) => (s.logoDataUrl ? `<img class="policy-logo" src="${s.logoDataUrl}" alt="Practice logo">` : ""),
  };
}

function titleBlock() {
  return {
    id: "title",
    type: "static",
    guidanceTitle: "Guidance and input for completing this Policy Template appears on this side of the page.",
    guidanceText:
      `The contents of this template policy builder stays locally in your browser, rather than being uploaded anywhere on the internet.
      <br/><br/>
      <div style="padding: 10px; border: 1px solid red;">
      <strong>The wording of this policy is suggested, not mandatory, and you are permitted to change or adapt if you see fit for your practice.
      However, it does form a robust starting point; you can download a Word document version to further edit if you prefer.</strong>
      <br/><br/>
      It is hoped that the contents and guidance prove useful; it has been written and reviewed by those with expertise in AI technology, research, and practice leadership.
      <br/><br/>
      We do recommend seeking input from your professional advisor on all practice policies.</div>
      `,
    render: () => `<h1>Artificial Intelligence Policy</h1>`,
  };
}

function practiceNameBlock() {
  return {
    id: "practiceName",
    type: "text",
    field: "practiceName",
    label: "Practice Name",
    placeholder: "e.g. ACME Architecture Ltd",
    render: (s) => `<h3>Practice Name: ${esc(s.practiceName) || "[Practice Name]"}</h3>`,
  };
}

function effectiveDateBlock() {
  return {
    id: "effectiveDate",
    type: "text",
    field: "effectiveDate",
    label: "Date",
    placeholder: "The date this policy will be effective",
    render: (s) => `<h3>Date: ${esc(s.effectiveDate) || "[Date]"}</h3>`,
  };
}

function responsiblePersonBlock() {
  return {
    id: "responsiblePerson",
    type: "text",
    field: "responsiblePerson",
    label: "Name of Responsible Person",
    placeholder: "e.g. John Smith",
    guidanceText: "The policy assumes a named Responsible Person, referred to throughout the document.",
    render: (s) => `<h4>Name of Responsible Person: <strong>${esc(s.responsiblePerson) || "[Responsible Person]"}</strong></h4>`,
  };
}

// ------------------------------------------------------------------
// Small fragments of policy wording that happen to be word-for-word
// identical in both source documents.
// ------------------------------------------------------------------

// The three bullets under "Human Oversight" / "Practically, a review
// may comprise some or all of the following:" - identical in both docs.
function reviewPracticalBulletsHtml() {
  return `<ul>
        <li>Critically reading AI generated output to catch inaccuracies/inconsistences/unwanted content/hallucinations.</li>
        <li>Tracing any provided references back to source material, to verify the reference says what the AI output claims.</li>
        <li>[Most onerous] Capturing and correcting "errors of omission" where the AI output does <strong>not</strong> contain a
        piece of information that should have been included. This
        can only be done by manual source material research.</li>
      </ul>`;
}

// The "Sustainability" section's operative wording - identical in both
// documents (the guidance shown alongside it differs slightly between
// templates, since the full template also mentions the Permitted Use
// "Type" field, which the simplified template doesn't have).
function sustainabilityRender() {
  return `<h2>Sustainability</h2>
      <p>We commit to deciding on AI technology adoption in ways that support environmental responsibility and
      carefully consider its carbon footprint in terms of energy and resource usage.</p>
      <p>Sustainable practice is an ethical priority for us, and the significant impact of global AI
      infrastructure on operational carbon emissions and other environmental factors will be considered and
      accounted for, alongside any potential benefits and impacts, in our Permitted Use decision-making process
      insofar as reasonably practicable.</p>`;
}

// The EU AI Act watermarking checkbox clause - identical in both
// documents, right down to the wording of the clause it reveals.
function euAiActWatermarkingBlock() {
  return {
    id: "euAiActWatermarking",
    type: "checkbox",
    field: "euAiActWatermarking",
    label: "Practice operates under the jurisdiction of the EU AI Act (watermarking must be enforced)",
    guidanceTitle: "EU AI Act watermarking",
    guidanceText:
      "If your practice operates in the EU and comes under the EU AI Act legislation, tick this box to include the watermarking requirement below. Seek professional legal advice regarding compliance in a particular jurisdiction.",
    render: (s) =>
      s.euAiActWatermarking
        ? `<p><strong>Any AI-generated output (of any form) that is presented to a client or issued from the practice
           must be clearly watermarked or identified as such.</strong></p>`
        : "",
  };
}
