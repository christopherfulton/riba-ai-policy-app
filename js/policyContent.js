/*
 * policyContent.js
 * ------------------------------------------------------------------
 * This file is a word-for-word translation of "Template Policy.docx"
 * into the block structure the app renders. This is the file to edit
 * if the underlying policy wording changes.
 *
 * The app is built from a list of "blocks". Each block produces one
 * row on screen: policy wording on the left, guidance + an input
 * control on the right. Every block has a `render(state)` function
 * that returns the HTML to show on the left, given the current
 * answers (`state`). Use `esc()` to safely insert user-typed text.
 *
 * Shared utility functions (esc, yesNoText, rp, blankRowFor) that
 * operate on the user's answers live in policyHelpers.js, loaded
 * before this file - keeping this file focused on wording/options.
 *
 * A few passages in the source document referred to "Page 1" / "page 2"
 * (paper pagination that doesn't apply to this single scrolling page).
 * Where that happened, the Responsible Person's actual name is
 * interpolated in place of the page reference instead - noted inline
 * with an ADAPTED comment below.
 *
 * Top-level block types used below:
 *   "static"          - plain paragraph(s), no input
 *   "text"             - single-line free text box
 *   "textarea"         - multi-line free text box
 *   "checkbox"         - a single Yes/No tickbox
 *   "choice"           - radio buttons: pick ONE clause out of several
 *   "choiceText"       - radio buttons where some options reveal a text box
 *   "multi"            - checkboxes: pick ANY NUMBER of clauses
 *   "multiOther"       - checkboxes plus an "Other" box that reveals free text
 *   "image"            - file picker for an image, resized client-side to a
 *                        fixed height (canvas + data: URL, never uploaded
 *                        anywhere) - used for the practice logo
 *   "list"             - a repeatable set of entries, each built from
 *                        `entryFields` (see PERMITTED_USE_FIELDS below).
 *                        Used for the Permitted Use register.
 *
 * Entry field types (used inside a "list" block's `entryFields`):
 *   "text", "textarea", "checkbox" (single yes/no tickbox),
 *   "yesno" (Yes/No radio pair), "multiOther" (checkboxes + an "Other"
 *   box), "choiceText" (radio buttons + a text box for the chosen option)
 * ------------------------------------------------------------------
 */

// ------------------------------------------------------------------
// OPTIONS - the checkbox/radio choices offered for each of these
// questions. To change what a user can pick from (add, remove, reword
// an option), edit the relevant list below. Each option's `value` is
// the bit stored in state/saved links, so renaming a `value` on an
// option that's already in use will orphan any previously-ticked
// answers - change `label` freely, but treat `value` as fixed once used.
// ------------------------------------------------------------------

const ETHICAL_DIMENSION_OPTIONS = [
  { value: "environmental", label: "Environmental and sustainability issues" },
  { value: "copyright", label: "Training of AI models on copyrighted data" },
  { value: "roleReplacement", label: "Role replacement and junior entry to the profession" },
  { value: "cognitiveSovereignty", label: "Cognitive sovereignty, offloading and atrophy of professional skills" },
  { value: "biasEquality", label: "Bias and equality" },
  {
    value: "stakeholderWellbeing",
    label: "Consideration of the impacts our use of AI may have on the wellbeing of affected stakeholders and communities",
  },
];

const COGNITIVE_OFFLOADING_OPTIONS = [
  {
    value: "draftFirst",
    label: "Always draft first: We put our own rough thoughts, thesis, or problem-solving steps on paper before opening an AI service.",
  },
  {
    value: "noCopyPaste",
    label: "Never copy-paste directly from a chatbot into your work; rephrase and contextualise the output manually.",
  },
  {
    value: "noExternalText",
    label: "Not allowing AI text generation for any project work or documents that will be shared outside the practice.",
  },
  {
    value: "excludeService",
    label: "Excluding particular AI services or tools from Permitted Use",
  },
];

const IP_MITIGATION_OPTIONS = [
  {
    value: "internalOnly",
    label:
      "do not allow any AI-generated output, of any type, to be presented or shared outside the company, only allowing it as internal “sketch” or “mood boarding” processes",
  },
  {
    value: "reviewCompliance",
    label: "review all AI outputs with specific focus on compliance with copyright and trademark laws, and prevent use of third-party content",
  },
  {
    value: "avoidIpInPrompts",
    label: "avoid specific IP in prompts (for example, do not use the names of artists, designers or brands/logos in prompts)",
  },
  {
    value: "noRawOutput",
    label:
      "do not allow “raw” AI output to be included in commercial projects without review or editing. For example, you may use AI-generated imagery or text as a starting point, and then sketch over, re-write or edit this to recapture human ownership.",
  },
  {
    value: "agreedTos",
    label: "explicitly agree commercial use with all our AI service provider(s), with signed Terms of Service which includes indemnity against copyright claims.",
  },
  {
    value: "reverseImageCheck",
    label: "always check AI-generated imagery or media for similarity to existing copyrighted work by performing a reverse-image or web search.",
  },
];

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

// The fields that make up ONE entry in the Permitted Use register
// (matches the 12-row table at the end of the source document).
const PERMITTED_USE_FIELDS = [
  { type: "text", key: "name", label: "Name of AI tool/model/service", placeholder: "e.g. ChatGPT Enterprise" },
  {
    type: "multiOther",
    key: "types",
    otherKey: "typeOther",
    label: "Type",
    options: PERMITTED_USE_TYPE_OPTIONS,
  },
  { type: "textarea", key: "benefits", label: "Benefits", placeholder: "What value does this tool provide?" },
  { type: "textarea", key: "risks", label: "Risks", placeholder: "What are the known risks?" },
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
  },
];

// Default values for every field this policy collects.
const DEFAULT_STATE = {
  logoDataUrl: "", // data: URL of the uploaded practice logo, pre-resized to 150px tall
  practiceName: "",
  effectiveDate: "",
  responsiblePerson: "",
  intersectingPolicies: "",
  ethicalDimensions: [], // subset of ETHICAL_DIMENSION_OPTIONS values, plus "other"
  ethicalDimensionsOther: "",
  cognitiveOffloadingMethods: [], // subset of COGNITIVE_OFFLOADING_OPTIONS values, plus "other"
  cognitiveOffloadingOther: "",
  dataTransparencyOption: "", // "permission" | "inform"
  ipMitigationStrategies: [], // subset of IP_MITIGATION_OPTIONS values, plus "other"
  ipMitigationStrategiesOther: "",
  hallucinationReportChannel: "", // "responsiblePerson" | "team" | "itHelpdesk" | "other"
  hallucinationReportDetail: "",
  euAiActWatermarking: false,
  clientOptOutClause: false,
  clientCommunicationTextEnabled: false,
  clientCommunicationText: "",
  reviewAndChangeChoice: "", // "responsiblePerson" | "team" | "itHelpdesk" | "other"
  reviewAndChangeText: "",
  permittedUses: [], // rich entries shaped by PERMITTED_USE_FIELDS
};

function permittedUseEntryHtml(row) {
  const typeLabels = PERMITTED_USE_TYPE_OPTIONS.filter((o) => (row.types || []).includes(o.value)).map(
    (o) => o.label
  );
  if ((row.types || []).includes("other") && row.typeOther) typeLabels.push(esc(row.typeOther));
  const scopeOption = { specific: "Specific people", group: "Groups/subsets of the practice", whole: "Whole practice" }[
    row.permittedUserScope
  ];

  return `<div class="permitted-entry">
    <h3>${esc(row.name) || "[Unnamed tool]"}</h3>
    <table class="permitted-entry-table">
    <tbody>
      <tr>
        <th>Permitted User(s)</th>
        <td>${scopeOption ? esc(scopeOption) : "[Not specified]"}${
    row.permittedUserScope && row.permittedUserScope !== "whole" && row.permittedUserNames
      ? `: ${esc(row.permittedUserNames)}`
      : ""
  }</td>
        <th>Type</th>
        <td>${typeLabels.length ? esc(typeLabels.join(", ")) : "[Not specified]"}</td>
      </tr>
      <tr>
        <th>Benefits</th>
        <td colspan="3"> ${esc(row.benefits) || "[Not specified]"}</td>
      </tr>
      <tr>
        <th>Risks</th>
        <td colspan="3"> ${esc(row.risks) || "[Not specified]"}</td>
      </tr>
      <tr>
        <th>Example(s) of Permitted Use (DOs)</th>
        <td colspan="3"> ${esc(row.examplesDo) || "[Not specified]"}</td>
      </tr>
      <tr>
        <th>Example(s) of misuse/non-permitted use (DON'Ts)</th>
        <td colspan="3"> ${esc(row.examplesDont) || "[Not specified]"}</td>
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

const POLICY_BLOCKS = [
  {
    id: "logo",
    type: "image",
    field: "logoDataUrl",
    label: "Practice logo (optional)",
    guidanceTitle: "Practice logo",
    guidanceText:
      `Upload an image from your computer. It stays entirely in your browser and is automatically resized to 75px tall.
      <br/>Note: the logo is not included in the \"Bookmark your progress\" link - it will need to be re-uploaded after opening a bookmarked/pasted link.
      `,
    render: (s) => (s.logoDataUrl ? `<img class="policy-logo" src="${s.logoDataUrl}" alt="Practice logo">` : ""),
  },
  {
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
  },
  {
    id: "practiceName",
    type: "text",
    field: "practiceName",
    label: "Practice Name",
    placeholder: "e.g. ACME Architecture Ltd",
    render: (s) => `<h3>Practice Name: ${esc(s.practiceName) || "[Practice Name]"}</h3>`,
  },
  {
    id: "effectiveDate",
    type: "text",
    field: "effectiveDate",
    label: "Date",
    placeholder: "e.g. 1 September 2026",
    render: (s) => `<h3>Date: ${esc(s.effectiveDate) || "[Date]"}</h3>`,
  },
  {
    id: "responsiblePerson",
    type: "text",
    field: "responsiblePerson",
    label: "Name of Responsible Person",
    placeholder: "e.g. John Smith",
    guidanceText:
      "The policy assumes a named Responsible Person, referred to throughout the document.",
    render: (s) => `<h4>Name of Responsible Person: <strong>${esc(s.responsiblePerson) || "[Responsible Person]"}</strong></h4>`,
  },
  {
    id: "purpose",
    type: "static",
    guidanceText: "",
    render: (s) =>
      `<h2>Purpose of this Policy:</h2>
      <p>Use of Artificial Intelligence technology of different types, but especially generative AI, carries potential
      for both benefits and risks to architecture practices and individuals. The challenge for architectural
      practices is to critically engage in evaluation, decision and application of any AI technology, so that
      benefits may be maximised and risks mitigated.</p>
      <p>This policy is designed to govern responsible use of AI technology in our organisation and workflows
      in a safe, ethical and legally compliant manner, in line with our vision, values and goals.</p>
      <p>The policy sets out our approach in line with RIBA's “Core Principles of AI Use”, and includes a
      “Permitted Use” list, defining which AI/Machine Learning services, tools and models may be used within
      our organisation, how they may be used, by whom, and a framework by which decision-making should be
      carried out.</p>
      <p>Any questions in relation to this policy should be referred to the above Responsible Person, in the
      first instance.</p>`,
  },
  {
    id: "responsiblePersonSection",
    type: "static",
    pageBreak: true,
    guidanceText: "",
    render: (s) =>
      `<h2>Responsible Person &amp; Practice Users</h2>
      <p>Generative AI tools, despite sometimes having simple user interfaces, depend on hidden complexity.
      The unseen and non-deterministic manner in which they function is sometimes referred to as a “black box”,
      and can lead inexperienced members to over-estimate, or under-estimate, the capabilities or risks of an
      AI service, as well as fall into “cognitive offloading” by trusting generative AI output unthinkingly.</p>
      <p>In particular, users of generative AI may be prone to anthropomorphising generative AI services and assuming
      human-like intelligence behind them, or over-relying on the results provided. This leads to risks
      when generative AI/LLMs act in ways that lack  reasoning, understanding or ideas of truth about the
      world, or provide results that contain errors or other issues.</p>
      <p>Therefore, the processes of choosing, deploying, and using AI tools our practice must be undertaken by
      those with sufficient, appropriate and relevant knowledge, ensuring responsible AI use. Such knowledge
      includes aspects such as AI types, some technical understanding of the way machine learning models work,
      their limitations, failures, innate biases, legal and contractual risks, and IP ownership.</p>
      <p>The person with overall responsibility, and the appropriate competence, for this in our practice is
      <strong>${rp(s)}</strong>.</p>`,
  },
  {
    id: "issuesOverview",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Ethical, Legal, Commercial and Safety Issues Considered in this Policy</h2>
      <ul>
        <li>Intersecting policies and governance</li>
        <li>Ethics and Accountability</li>
        <li>Human Oversight</li>
        <li>Competence</li>
        <li>Training</li>
        <li>Data Governance and Privacy</li>
        <li>Intellectual Property</li>
        <li>Legal and Regulatory Compliance</li>
        <li>Risk Management and Assurance</li>
        <li>Fairness, Bias and Equality</li>
        <li>Reliability, Hallucination and Sycophancy</li>
        <li>Client Communication and Consent</li>
        <li>Sustainability</li>
        <li>Role displacement</li>
      </ul>`,
  },
  {
    id: "intersectingPolicies",
    type: "textarea",
    pageBreak: true,
    field: "intersectingPolicies",
    label: "Add any other intersecting practice policies (optional) ",
    placeholder:
      "",
    guidanceTitle: "Intersecting governance/policies",
    guidanceText:
      `Add any further relevant practice policy documents or governance information here - 
      for example, specific sustainability, ESG, HR, IT, security or business structure 
      information that may impact on your practice's AI decision-making`,
    render: (s) =>
      `<h2>Intersecting Policies and Governance</h2>
      <p>Our policy for engaging with AI technologies considers a wider framework of inter-related existing
      governance, including such aspects as:</p>
      <ul>
        <li>UK Legislation: GDPR, Data Protection Act 2018, the Equality Act 2010, the Online Safety Act 2023,
        and intellectual property law</li>
        <li>EU and international regulation (where applicable) - for example, the EU AI Act.</li>
        <li>The RIBA Code of Practice</li>
        <li>The RIBA Code of Conduct</li>
        <li>The RIBA Core Principles of AI Use</li>
        <li>ARB Standards</li>
        <li>Our legal obligations under contractual appointments</li>
        <li>Quality Assurance, Professional Indemnity and financial/commercial requirements</li>
        <li>Employers' obligations</li>
        <li>Our environmental policy</li>
        <li>Our practice business plan</li>
        ${
          s.intersectingPolicies && s.intersectingPolicies.trim()
            ? `<li>${esc(s.intersectingPolicies).replace(/\n/g, "<br>")}</li>`
            : ""
        }
      </ul>
      <p>Taken together, the addition of this AI Policy exists to build a suite of governance which underpins
      an intended consistent culture of practice, supports responsible innovation, and fosters creativity. It
      also provides mitigation measures for potential risk and liability for the practice as a whole. In
      addition, it expresses the ethical values for our firm, the projects we design and deliver, and the
      people who use them.</p>`,
  },
  {
    id: "ethicsAccountability",
    type: "multiOther",
    field: "ethicalDimensions",
    detailsField: "ethicalDimensionDetails",
    otherField: "ethicalDimensionsOther",
    options: ETHICAL_DIMENSION_OPTIONS,
    guidanceTitle: "Ethical concerns",
    guidanceText:
      "Tick any specific ethical concerns that apply to your practice. If you add something here, you are also saying this factor will be considered when evaluating any AI service or tool as 'Permitted Use' later.",
    render: (s) => {
      const selected = ETHICAL_DIMENSION_OPTIONS.filter((o) => (s.ethicalDimensions || []).includes(o.value));
      
      const items = selected
        .map((o) => {
          
          return `<li>${esc(o.label)}</li>`;
        })
        .join("");
      const otherItem =
        (s.ethicalDimensions || []).includes("other") && s.ethicalDimensionsOther
          ? `<li>${esc(s.ethicalDimensionsOther)}</li>`
          : "";
      return `<h2>Ethics and Accountability</h2>
        <p>Professional, ethical and legal liability always remains with the practice, not any AI service or
        tool. AI does not provide any replacement for professional judgement or human accountability, and
        responsibility cannot be delegated to an AI service.</p>
        ${(items || otherItem) ? `<p>Specific ethical concerns may exist for our practice in questions of:</p>` : ""}
        ${(items || otherItem) ? `<ul>${items}${otherItem}</ul>` : ""}
        ${(items || otherItem) ? `<p>These inform our decision-making and evaluation process for selection and use of AI technology and
        may impact or rule in/out inclusion of specific tools in our Permitted Use list.</p>` : ""}
        `;
    },
  },
  {
    id: "humanOversight",
    type: "static",
    guidanceText: `"Checking and reviewing output" is a requirement that appears a number of times in this policy template.
    <br/><br/>
    In practice, this means three increasingly rigorous tiers of actually doing a review, which should be evaluated based on the nature and criticality of the output:
    <br/><br/>
    1. Reading the AI output diligently and with a "critical eye" (but in isolation) to catch inaccuracies, unwanted content or hallucinations;
    <br/><br/>
    2. Tracing any references provided back to find actual source material, to verify that the reference says what the output claims;
    <br/><br/>
    3. To capture errors of omission (where the AI output did not contain an important piece of information that would have been necessary), the only option 
    is to trace information directly from a primary source, or wide set of sources. It's worth noting here that the only logical method for avoiding such errors of omission means 
    doing significant research yourself, without the AI.
    <br/><br/>
    <strong>A successful implementation of this requirement will involve creating a culture where staff feel 
    confident overruling or checking an AI-generated output, and no-one worries that they may be penalised for doing so.</strong>`,
    render: () =>
      `<h2>Human Oversight</h2>
      <p>Human oversight in the form of content review and quality check must be applied to all AI-generated
      outputs, including those embedded within familiar tools such as web search, word processing or email
      applications. Individuals in our practice must apply their skill, knowledge and expertise to assess
      whether they are suitable for the intended use and do not contain unacceptable errors, inaccuracies or omissions.</p>
      <p>Practically, a review may comprise some or all of the following:</p>
      <ul>
        <li>Critically reading AI generated output to catch inaccuracies/inconsistences/unwanted content/hallucinations.</li>
        <li>Tracing any provided references back to source material, to verify the reference says what the AI output claims.</li>
        <li>[Most onerous] Capturing and correcting "errors of omission" where the AI ouput does <strong>not</strong> contain a 
        piece of information that should have been included. This
        can only be done by manual source material research.</li>
      </ul>
      <p>Professional judgement always takes precedence over any AI-generated output.</p>
      <p>We never share AI-generated outputs outside the practice without prior internal review and
      oversight.</p>`,
  },
  {
    id: "competence",
    type: "static",
    guidanceText: `Nothing is changing with existing regulatory guidance from RIBA and other professional bodies about what it means to *be an architect* - 
    crucially, this means we must put human architects and staff at the centre of any policy approach, as they are the only entities that can be professionally
    insured and regulated to carry out architectural work.
    <br/><br/>
    So, the same competence requirements that already exist in the Code of Practice and Code of Conduct will still apply, and it is important to note
    that AI systems, however capable, cannot act with professional judgment, nor can they carry liability or be insured.
    `,
    render: (s) =>
      `<h2>Competence</h2>
      <p>Staff members in our practice must only undertake work they are competent to do. This is not altered
      by any AI technologies - any Permitted Use only applies to tasks that fall within an individual's current
      knowledge and skills, so that any AI-generated outputs can be adequately assessed.</p>
      <p>Examples of use outside of such competencies (and potentially outside the practice's insurance cover),
      and which are therefore prohibited in our practice, include:</p>
      <ul>
        <li>Providing AI-generated advice to a client in a discipline you are not qualified to advise in, and
        where expertise does not exist in our practice; for example, structural engineering or ecological
        consultancy.</li>
        <li>Generating software code ('vibe-coding') or creating internal applications or scripts, if you
        or others in the practice do not already have experience in such code development or the ability to review,
        understand, and ensure the output is safe or reliable.</li>
      </ul>
      <p>Where uncertain about a particular AI use, please contact the Responsible Person (${rp(s)}) before implementing any AI
      use.</p>
      <p>Internal review processes and oversight chains for any AI output must include those with competence
      to adequately assess it.</p>
      <ul>
        <li>For example, an assistant may prompt an AI model but the review process to decide what output to
        accept/reject may require a more experienced practitioner;</li>
        <li>Or, a junior member of staff may need to check the accuracy of LLM-generated text information with
        a senior architect, technician or consultant before accepting its validity.</li>
      </ul>`,
  },
  {
    id: "cognitiveOffloading",
    type: "multiOther",
    pageBreak: true,
    field: "cognitiveOffloadingMethods",
    otherField: "cognitiveOffloadingOther",
    otherLabel: "Other",
    otherPlaceholder: "Describe another way the practice combats cognitive offloading",
    options: COGNITIVE_OFFLOADING_OPTIONS,
    guidanceTitle: "Combating cognitive offloading",
    guidanceText: "Select all that apply.",
    render: (s) => {
      const selected = COGNITIVE_OFFLOADING_OPTIONS.filter((o) => (s.cognitiveOffloadingMethods || []).includes(o.value));
      const items = selected.map((o) => `<li>${esc(o.label)}</li>`).join("");
      const otherItem =
        (s.cognitiveOffloadingMethods || []).includes("other") && s.cognitiveOffloadingOther
          ? `<li>${esc(s.cognitiveOffloadingOther)}</li>`
          : "";
      return `<h4>Supporting each other, and cognitive offloading:</h4>
        <p>Everyone has a crucial role to play in ensuring any use of generative AI does not undermine or
        negatively impact professional development and skills. This is especially a responsibility for more
        experienced colleagues, and those with leadership or managerial roles, to take seriously. “Cognitive
        offloading” poses a risk whereby reliance on generative AI output can lead to skills and knowledge
        being reduced over time - in our practice, we combat this by:</p>
        ${items || otherItem ? `<ul>${items}${otherItem}</ul>` : "<p><em>[No methods selected]</em></p>"}`;
    },
  },
  {
    id: "training",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Training</h2>
      <p>Wherever sufficient, appropriate and relevant knowledge and understanding to choose, deploy and/or
      use AI tools responsibly does not already reside within our practice, we will support professional
      development for staff to acquire, maintain and develop relevant and robust knowledge about the
      fast-changing technological landscape. This will include understanding of AI types, limitations,
      failures, innate biases, risks, and IP ownership, with ongoing professional/specialist advice and
      support as needed.</p>
      <p>This will form part of our programme of CPD.</p>
      <p>Where possible, we prefer any external CPD provider on this topic to not be concurrently engaged in
      the sale of AI software or subscriptions, as this may represent conflict of interest.</p>`,
  },
  {
    id: "dataGovernance",
    type: "choice",
    pageBreak: true,
    field: "dataTransparencyOption",
    guidanceTitle: "Client data transparency",
    guidanceText:
      "Choose from the following two options: option one is more onerous but offers clients more transparency, option two is easier to implement.",
    options: [
      {
        value: "permission",
        label: "1. Seek written permission from clients before AI use",
        clause: "This means written permission should be sought from a client before using their data in an AI service.",
      },
      {
        value: "inform",
        label: "2. Inform clients which AI tools we use",
        clause: "This means we inform clients about the AI services and tools we use.",
      },
    ],
    render: (s) => {
      const block = POLICY_BLOCKS_SELF().find((b) => b.id === "dataGovernance");
      const opt = PICK(block.options, s.dataTransparencyOption);
      return `<h2>Data Governance and Privacy</h2>
        <p>Data protection laws, policies and principles apply to all AI interactions in exactly the same way
        as all other software or web actions.</p>
        <p>All staff must ensure any data typed or uploaded into any AI tool (including prompts to AI chatbots
        and web searches) is either:</p>
        <ul>
          <li>already publicly available, or free of restriction (e.g. client confidentiality, commercial
          sensitivity), or</li>
          <li>protected to an appropriate level by only using generative AI services covered by enterprise
          data protection agreements (see Permitted Use section), or</li>
          <li>compliant with any data restrictions of the relevant contract governing that project or
          data.</li>
        </ul>
        <p>Personal and sensitive data can only be input or accessed by generative AI services in accordance
        with existing legislative requirements, and existing internal policy governing personal data.</p>
        <p><strong>We are transparent with other people about their data:</strong></p>
        <p>${opt ? opt.clause : "<em>[No option selected]</em>"}</p>`;
    },
  },
  {
    id: "intellectualProperty",
    type: "multiOther",
    field: "ipMitigationStrategies",
    otherField: "ipMitigationStrategiesOther",
    options: IP_MITIGATION_OPTIONS,
    guidanceTitle: "IP risk mitigation strategies",
    guidanceText: "Choose one or more mitigation strategies from the list - delete/leave unticked as appropriate.",
    render: (s) => {
      const selected = IP_MITIGATION_OPTIONS.filter((o) => (s.ipMitigationStrategies || []).includes(o.value));
      const items = selected.map((o) => `<li>${esc(o.label)}</li>`).join("");
      const otherItem =
        (s.ipMitigationStrategies || []).includes("other") && s.ipMitigationStrategiesOther
          ? `<li>${esc(s.ipMitigationStrategiesOther)}</li>`
          : "";
      return `<h2>Intellectual Property</h2>
        <p>AI generative tools produce content based on training data that almost certainly includes other
        copyrighted works. Using AI-generated images or text in deliverables may expose the practice to
        copyright infringement risks or allegations if these are not properly licensed.</p>
        <p>To mitigate or avoid this risk, we…</p>
        ${(items || otherItem) ? `<ul>${items}${otherItem}</ul>` : "<p><em>[No mitigation strategies selected]</em></p>"}
        <p>Further, all staff need to be aware that any AI-generated work the practice might produce or
        deliver is not covered by intellectual property protection and cannot be trademarked or protected by
        copyright.</p>`;
    },
  },
  {
    id: "legalCompliance",
    type: "static",
    guidanceText: "",
    render: (s) =>
      `<h2>Legal and Regulatory Compliance</h2>
      <p>In any use of AI tools, everyone remains responsible for ensuring that all their work conforms to the
      relevant legislation, standards and contractual obligations. Use of AI does not provide an excuse for
      anyone to be in breach of their responsibilities.</p>
      <p>The Responsible Person named on Page 1 <strong>must confirm with our Public Indemnity insurers that our PI cover remains valid</strong>
      before adding any AI technology as part of project delivery to the Permitted Use list (found later in
      this document).</p>
      <p>The practice must be able to account for and explain all design outputs, including any that have
      involved the use of AI. Design decision-making and associated explanations cannot be delegated or
      avoided by the use of AI tools, as their "black-box" nature does not allow for “explainability” behind
      the output. Golden Thread requirements under Building Safety legislation for design decisions still
      apply.</p>
      <p>References to AI in scope and contract documents must be reviewed by the Responsible Person for
      acceptability from a risk and insurance perspective.</p>
      <p><strong>Before you ever input data to a system or make files or information accessible to an AI service or
      tool, ask yourself: “Could this information cause harm if it were made public?”. If yes, do not share it
      with external AI services without seeking the Responsible Person's written approval.</strong></p>
      <p>Examples of data
      you must never share with external services: client names, project details, colleagues' personal
      information, financial data, security credentials, contract terms, internal communications.</p>`,
  },
  {
    id: "riskManagement",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Risk Management and Assurance</h2>
      <p>Generative AI introduces specific risks, such as often producing incorrect outputs, or outputs that
      are biased in some way.</p>
      <p>All use of generative AI by staff must take into account hallucinations, errors, and eagerness to
      please (“sycophancy”).</p>
      <p>When planning any use of generative AI to produce output, the required time and effort to check for
      accuracy and bias, and edit as necessary, should be accounted for.</p>
      <ul>
        <li>A common temptation is to consider using AI generation in tasks or situations where there may be a
        significant or unusual time pressure, for example a tight deadline or late submission. Be aware that
        this is where such risks are greater, and checking output is more likely to be missed or ignored. This
        should never be an excuse for skipping review and checking. Consider alternative approaches or
        adjusting expectations for time required to check output.</li>
      </ul>
      <p>Quality assurance procedures and policies continue to hold for all project activities.</p>`,
  },
  {
    id: "fairnessBias",
    type: "static",
    pageBreak: true,
    guidanceText: "",
    render: () =>
      `<h2>Fairness, Bias and Equality</h2>
      <p>All staff must be alert to AI bias.</p>
      <p>This can manifest itself in different ways:</p>
      <ul>
        <li>An AI model may be likely to generate examples of certain particular architectural styles,
        regions, or colour palettes far more readily than others.</li>
        <li>A model may also output content skewed to a particular world-view, belief system or ethical code,
        following larger numbers of examples of these found in its training data.</li>
        <li>Outputs often highlight and emphasize existing biases towards people and their shared
        characteristics.</li>
      </ul>
      <p>This risks hindering inclusivity and increasing unfairness. Professional judgment should always be
      applied when using AI to promote and protect the public interest and social purpose.</p>
      <p>Review all generative AI output for bias or inappropriate content before sharing with colleagues
      or clients.</p>`,
  },
  {
    id: "reliabilityStatic",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Reliability, Hallucination and Sycophancy</h2>
        <p>Large Language Models answer questions/prompts confidently yet incorrectly at a much higher rate
        than most people realise - the text “feels” right but contains inaccurate information.</p>
        <ul>
          <li>For example: false information about building regulations, planning law, accessibility or
          sustainability criteria, design specifications, etc, will lead to the practice bearing the risk and
          liability for any resulting issues.</li>
        </ul>
        <p>Staff must follow all existing procedures and policies and embrace a culture of critical judgement
        and quality review, in line with the risk mitigation strategies outlined above under “Risk Management
        and Assurance”.</p>
        <p>Failure to do so may break a key requirement in our codes of practice with both the RIBA and ARB,
        and lead to liability under our contractual appointments with our clients, including to use
        “reasonable skill and care” in providing our services.</p>`,
  },
  {
    id: "reliability",
    type: "choiceText",
    field: "hallucinationReportChannel",
    textField: "hallucinationReportDetail",
    textPlaceholder: "Enter the team name, or other reporting channel",
    hideTextFor: ["responsiblePerson", "itHelpdesk"],
    guidanceTitle: "Reporting hallucinations",
    guidanceText: "Select who unwanted or inaccurate AI outputs should be reported to.",
    options: [
      { value: "responsiblePerson", label: "Responsible Person" },
      { value: "team", label: "Specific internal team" },
      { value: "itHelpdesk", label: "IT Helpdesk" },
      { value: "other", label: "Other" },
    ],
    render: (s) => {
      const block = POLICY_BLOCKS_SELF().find((b) => b.id === "reliability");
      const opt = PICK(block.options, s.hallucinationReportChannel);
      let channelText = "[Not yet selected]";
      if (opt) {
        channelText =
          opt.value === "responsiblePerson"
            ? rp(s)
            : opt.value === "itHelpdesk"
            ? "the IT Helpdesk"
            : s.hallucinationReportDetail
            ? esc(s.hallucinationReportDetail)
            : `[${opt.label} - not yet specified]`;
      }
      return `
        <p>DO: Review all outputs, including web search queries, for accuracy. AI can and does produce hallucinations.</p>
        <p>DO: Check facts against reliable sources, particularly for technical, financial, or client-facing
        work.</p>
        <p>DO: Correct any errors or inaccuracies yourself.</p>
        <p>DON'T: Prompt AI to fix its own errors or inaccuracies.</p>
        <p>DON'T: Share AI output “as is” in external communications, without reviewing and correcting yourself.</p>
        <p>DO: If you find hallucinations, inaccuracies or unwanted outputs, report these to
        <strong>${channelText}</strong>.</p>`;
    },
  },
  {
    id: "clientCommunication",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Client Communication and Consent</h2>
      <p>We are transparent and communicate with clients about <strong>if</strong>, <strong>how</strong>, and <strong>why</strong> we use AI in projects.</p>`,
  },
  {
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
  },
  {
    id: "clientAttribution",
    type: "static",
    guidanceText: "",
    render: () =>
      `<p>For any AI-generated output that is shared outside the practice, we always attribute the
      service/tool used, and the person who reviewed/edited the output. This should be captioned or referenced
      clearly. Example: “<i>This proposal abstract was drafted using ChatGPT 5 and edited by XX, XX Director</i>”, or,
      “<i>This concept/study image was generated using Nano Banana Pro, and edited/reviewed by XX</i>”.</p>
      <p>All staff must maintain records of when and how they used AI so it can be accounted for if asked.
      Trust and transparency benefit everyone.</p>`,
  },
  {
    id: "clientOptOutClause",
    type: "checkbox",
    field: "clientOptOutClause",
    label: "Include the client opt-out clause",
    guidanceTitle: "Client Opt-Out",
    guidanceText:
      `This clause represents a high degree of client consent but is more onerous to apply. Tick to include it, leave unticked to omit it.
      <br/><br/>
      An example might be if your practice works on projects with religious organisations such as the Catholic Church, with its well-published and 
      ethically-argued position on generative AI, where it may be of commercial benefit to avoid or constrain its use on a project-by-project, or 
      client-by-client, basis.
      <br/><br/>
      Be aware, however, that such an approach would require the administrative and contractual processes in place to support this.
      `,
    render: (s) =>
      s.clientOptOutClause
        ? `<p>Through open conversation, we may choose to support clients' requests to “opt-out” of some
           generative AI use (where practical) on projects, for example in situations where a client's own
           policies or ethical standpoint does not support such use. Examples might be an organisation
           preferring not to engage with AI-generated concept imagery as part of early-stage design, even if
           such a process is normally permitted internally in our practice; or, a client requesting generative
           AI notetakers to be excluded from a meeting.</p>`
        : "",
  },
  {
    id: "clientOptOutFollowUp",
    type: "static",
    guidanceText: `As discussed in the RIBA AI Overlay to the Plan of Work, it may be beneficial to create bespoke project-specific AI plans 
    for each project, however it's not a good idea to use a particular service or tool just because a client requests it - make these decisions based on 
    what is best for your workforce and practice.
    
    `,
    render: () =>
      `<p>Use of AI services contrary to the Permitted Use list (later in this document) is
      not allowed, even if a client requests such use.</p>`,
  },
  {
    id: "clientCommunicationTextEnabled",
    type: "checkbox",
    field: "clientCommunicationTextEnabled",
    label: "Include explanatory AI-use text in our standard appointment documentation",
    guidanceText: "Tick to include this section, then enter the actual wording below - it depends on practice preference.",
    render: (s) =>
      s.clientCommunicationTextEnabled
        ? `<p>Explanatory text relevant to AI use by us and/or our clients is included in our standard
           appointment communication or documentation. This text is as follows:</p>
           <p>${
             s.clientCommunicationText && s.clientCommunicationText.trim()
               ? esc(s.clientCommunicationText).replace(/\n/g, "<br>")
               : "<em>[Insert client communication text here]</em>"
           }</p>`
        : "",
  },
  {
    id: "clientCommunicationText",
    type: "textarea",
    field: "clientCommunicationText",
    label: "Client communication text",
    placeholder: "Insert client communication text here",
    guidanceText: "Only appears in the policy if the checkbox above is ticked.",
    render: () => "", // rendered as part of the clientCommunicationTextEnabled block above
  },
  {
    id: "sustainability",
    type: "static",
    guidanceText: `
      It's often tricky to quantify the carbon footprint associated with generative AI usage, however there is ongoing research to do so by RIBA.
      <br/><br/>
      Bear in mind that single prompts to chatbots may appear to have a very small carbon footprint; however, an agent or loop approach could lead to 
      many thousands or even millions of "tokens" used by the generative AI service, each of which represent energy and resource implications.
      <br/><br/>
      So, the type of generative AI used is likely to impact this consideration - hence the inclusion of the "type" option under the Permitted Use section
      at the end of this document.
    `,
    render: () =>
      `<h2>Sustainability</h2>
      <p>We commit to deciding on AI technology adoption in ways that support environmental responsibility and
      carefully consider its carbon footprint in terms of energy and resource usage.</p>
      <p>Sustainable practice is an ethical priority for us, and the significant impact of global AI
      infrastructure on operational carbon emissions and other environmental factors will be considered and
      accounted for, alongside any potential benefits and impacts, in our Permitted Use decision-making process
      insofar as reasonably practicable.</p>`,
  },
  {
    id: "roleDisplacement",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Role Displacement</h2>
      <p>We commit to not using adoption of AI technologies as a reason, excuse or strategy for role
      displacement or staff reductions.</p>
      <ul>
        <li>Current AI systems have not demonstrated any ability to perform in a manner comparable to a
        person</li>
        <li>Removing highly adaptable and context-aware human judgement in favour AI technologies, along with
        their inherent limitations and risks as outlined in this document, is unlikely to represent net
        benefit to the practice</li>
        <li>Junior staff especially carry value as future architects and need opportunities for development
        and gaining experience.</li>
      </ul>`,
  },
  {
    id: "reviewAndChange",
    type: "choiceText",
    pageBreak: true,
    field: "reviewAndChangeChoice",
    textField: "reviewAndChangeText",
    textPlaceholder: "Enter the name of the team or person to contact",
    hideTextFor: ["responsiblePerson", "itHelpdesk"],
    guidanceTitle: "Changes or additions to Permitted Use",
    guidanceText: "Select who can review/change this Policy - they should also receive requests for tools/services to be added to the Permitted Use list",
    options: [
      { value: "responsiblePerson", label: "Responsible Person" },
      { value: "team", label: "Specific internal team" },
      { value: "itHelpdesk", label: "IT Helpdesk" },
      { value: "other", label: "Other" },
    ],
    render: (s) => {
      const block = POLICY_BLOCKS_SELF().find((b) => b.id === "reviewAndChange");
      const opt = PICK(block.options, s.reviewAndChangeChoice);
      let channelText = "[Not yet selected]";
      if (opt) {
        channelText =
          opt.value === "responsiblePerson"
            ? rp(s)
            : opt.value === "itHelpdesk"
            ? "the IT Helpdesk"
            : s.reviewAndChangeChoice
            ? esc(s.reviewAndChangeChoice)
            : `[${opt.label} - not yet specified]`;
      }
      return `
        <h2>Reviews of, and changes to, this Policy</h2>
        <p>If you have a request for an AI service/tool to be added or removed from the Permitted Use list (below), you should contact
        <strong>${channelText}</strong> in the first instance.</p>
        <p>AI services and tools should always be evaluated/tested in restricted pilot/sandbox environments before any implementation/rollout - plan ahead for the time this takes to set up.</p>
        <p>The Responsible Person (${rp(s)}) is ultimately responsible for approval or restriction of AI services/tools (see below).</p>
        <p>This Policy should be reviewed at a regular cadence, and dates and records of changes kept.</p>
        `;
    },
  },
  {
    id: "permittedUseIntro",
    type: "static",
    guidanceText:
      `If no generative AI technologies' benefits are considered to outweigh their risks, 
      or all are ruled out by ethical or other concerns, then the register below might be simply left blank. 
      <br/><br/>
      This effectively says "we don't approve any generative AI services or tools for use in our practice".
      <br/><br/>
      However, with the prevalence of generative AI services embedded in everything from web search to email clients, 
      you may find enforcing a total ban on generative AI use very difficult in practice, and it's likely that staff may decide to 
      use personal accounts outside of your control or oversight. 
      <br/><br/>
      At a minimum, it would be wise to include services such as Google's built-in "AI-mode" web search summary, and basic included generative AI features 
      such as CoPilot in Microsoft 365, or Gemini in Google Workspace, if these are used in your practice.
      `,
    render: (s) =>
      `<h1>Permitted Use</h1>
      <p>We are adopting a policy of Permitted Use.</p>
      <p>This allows us to engage in appropriate support, risk mitigation, and continue to
      evaluate/research/innovate on the use of AI technology by staff, but only Permitted Uses of Permitted
      Tools and Models, by Permitted Users.</p>
      <p>${rp(s)} will maintain this list and is responsible for approving or restricting a tool or service following a sandboxed/pilot evaluation process.</p>
      <p>Evaluation should be viewed holistically (ideally not at an individual isolated task level, but as part of
      an end-to-end delivery analysis), including taking account of time to review, iterate and edit
      AI-generated content, or to uncover any unintended consequences or other bottlenecks in an established
      process.</p>
      <p>Analysis may need to go as far as taking into account differences between individual staff (for
      example, perhaps some may work more productively through editing an AI output as an initial draft,
      whereas others may work effectively by retaining human ownership throughout).</p>
      <p>Use of AI-enabled services designed specifically for assisting in areas of neurodiversity or
      disability should be considered carefully in this light, to ensure equality of opportunity for all. 
      </p>`, // ADAPTED: "named on Page 1" -> interpolated name
  },
  {
    id: "permittedUses",
    type: "list",
    field: "permittedUses",
    entryFields: PERMITTED_USE_FIELDS,
    guidanceTitle: "Permitted Use register",
    guidanceText: "Add one entry per approved AI service, tool, or model.",
    render: (s) => {
      const rows = (s.permittedUses || []).filter((r) => r.name && r.name.trim());
      return rows.length ? rows.map(permittedUseEntryHtml).join("") : "<p><em>[No permitted technologies added yet]</em></p>";
    },
  },
];

// small helpers used above (kept local to this file)
function PICK(options, value) {
  return options.find((o) => o.value === value);
}
function POLICY_BLOCKS_SELF() {
  return POLICY_BLOCKS;
}
