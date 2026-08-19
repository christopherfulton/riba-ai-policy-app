/*
 * policyContentLite.js
 * ------------------------------------------------------------------
 * 
 */

// This template's Permitted Use register has no "Type" column - see
// policyContent.js's use of permittedUsesBlock({ includeType: true })
// for the full template's equivalent, which does.

// Default values for every field this policy collects.
const DEFAULT_STATE = {
  logoDataUrl: "", // data: URL of the uploaded practice logo, pre-resized to 150px tall
  practiceName: "",
  effectiveDate: "",
  responsiblePerson: "",
  hallucinationReportChannel: "", // "responsiblePerson" | "team" | "itHelpdesk" | "other"
  hallucinationReportDetail: "",
  euAiActWatermarking: false,
  clientCommunicationTextEnabled: false,
  clientCommunicationText: "",
  permittedUses: [], // rich entries shaped by buildPermittedUseFields({ includeType: false })
};

const POLICY_BLOCKS = [
  logoBlock(),
  titleBlock(),
  practiceNameBlock(),
  effectiveDateBlock(),
  responsiblePersonBlock(),
  {
    id: "purpose",
    type: "static",
    guidanceText: "",
    render: (s) =>
      `<h2>Purpose of this Policy:</h2>
      <p>Artificial Intelligence technology of different types, but especially generative AI, carries potential
      for both benefits and risks to architecture practices and individuals. The challenge for architectural
      practices is to critically engage in evaluation, decision and application of any AI technology, so that
      benefits may be maximised and risks mitigated.</p>
      <p>This policy is designed to govern responsible use of AI technology in our organisation in a safe,
      ethical and legally compliant manner, in line with our vision, values and goals.</p>
      <p>The policy sets out our approach in line with RIBA's “Core Principles of AI Use”, through a “Permitted
      Use” list, defining which AI/Machine Learning services, tools and models may be used within our
      organisation, how they may be used, by whom, and a framework by which decision-making should be carried
      out.</p>
      <p>Any questions in relation to this policy should be referred to the above Responsible Person, in the
      first instance.</p>`,
  },
  {
    id: "permittedUseIntro",
    type: "static",
    pageBreak: true,
    guidanceText: permittedUseIntroGuidance(),
    render: (s) =>
      `<h1>Permitted Use</h1>
      <p>We are adopting a policy of Permitted Use.</p>
      <p>This allows us to engage in appropriate support, risk mitigation, and continue to
      evaluate/research/innovate on the use of AI technology by staff, but only Permitted Uses of Permitted
      Tools and Models, by Permitted Users.</p>
      <p>${rp(s)} will maintain this list and is responsible for evaluating benefits and risks associated with
      any tool or service.</p>`, 
  },
  permittedUsesBlock({ includeType: false }),
  {
    id: "responsiblePersonSection",
    type: "static",
    pageBreak: true,
    guidanceText: "",
    render: (s) =>
      `<h2>Responsible Person &amp; Deploying AI services</h2>
      <p>Any AI services used in the practice should be tested and evaluated in a pilot/sandbox environment to
      decide if they should be made available more widely to staff.</p>
      <p>The person with overall responsibility, and the appropriate competence, for overseeing this
      approval/restriction process in our practice is <strong>${rp(s)}</strong>.</p>`, 
  },
  {
    id: "ethicsAccountability",
    type: "static",
    guidanceText:
      "The full-length policy template (Practice Profile 2) lets you tick off specific ethical concerns for your practice here; this simplified version keeps the wording fixed.",
    render: () =>
      `<h2>Ethics and Accountability</h2>
      <p>Professional, ethical and legal liability always remains with the practice, not any AI service or
      tool. AI does not provide any replacement for professional judgement or human accountability, and
      responsibility cannot be delegated to an AI tool.</p>
      <p>This informs the decision-making and evaluation process for selection and use of AI technology and may
      impact or rule in/out inclusion of specific tools in our Permitted Use list.</p>`,
  },
  {
    id: "humanOversight",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Human Oversight</h2>
      <p>Human oversight in the form of content review and quality check must be applied to all AI-generated
      outputs, including those embedded within familiar tools such as web search, word processing or email
      applications. Individuals in our practice must apply their skill, knowledge and expertise to assess
      whether they are suitable for the intended use and do not contain unacceptable errors, inaccuracies or
      omissions.</p>
      <p>Practically, a review may comprise some or all of the following:</p>
      ${reviewPracticalBulletsHtml()}
      <p>Professional judgement always takes precedence over any AI-generated output.</p>
      <p>We never share AI-generated outputs outside the practice without prior internal review and
      oversight.</p>`,
  },
  {
    id: "competence",
    type: "static",
    pageBreak: true,
    guidanceText: "",
    render: (s) =>
      `<h2>Competence</h2>
      <p>Staff members in our practice must only undertake work they are competent to do. This is not altered
      by any AI technologies – any Permitted Use only applies to tasks that fall within an individual's current
      knowledge and skills, so that any AI-generated outputs can be adequately assessed.</p>
      <p>Where uncertain about a particular use, please contact the Responsible Person (${rp(s)}) before
      implementing any AI use.</p>`,
  },
  {
    id: "legalCompliance",
    type: "static",
    guidanceText: "",
    render: (s) =>
      `<h2>Legal, Regulatory and Data Protection Compliance</h2>
      <p>In any use of AI tools, everyone remains responsible for ensuring that all their work conforms to the
      relevant legislation, standards and contractual obligations. Use of AI does not provide an excuse for
      anyone to be in breach of their responsibilities.</p>
      <p>The Responsible Person (${rp(s)}) must confirm with our Public Indemnity insurers that our PI cover
      remains valid before adding any AI technology as part of project delivery to the Permitted Use list
      (found earlier in this document).</p>
      <p>The practice must be able to account for and explain all design outputs, including any that have
      involved the use of AI.</p>
      <p>Data protection laws, policies and principles apply to all AI interactions in exactly the same way as
      all other software or web actions.</p>
      <p>Before you ever input data to a system or make files or information accessible to an AI service or
      tool, ask yourself: “Could this information cause harm if it were made public?”. If yes, do not share it
      with external AI services without seeking the Responsible Person's written approval.</p>
      <p>Examples of data you must never share with external services: client names, project details, anything
      commercially sensitive to clients or under NDA, colleagues' personal information, financial data,
      security credentials, contract terms, internal communications…</p>`, 
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
      <p>DO: Review any generative AI output for bias or inappropriate content before sharing with colleagues
      or clients.</p>
      <p>DON'T: Share AI output “as is” in external communications, without reviewing and correcting
      yourself.</p>`,
  },
  {
    id: "reliabilityStatic",
    type: "static",
    pageBreak: true,
    guidanceText: "",
    render: () =>
      `<h2>Reliability, Hallucination and Sycophancy</h2>
      <p>Large Language Models answer questions/prompts <i>confidently yet incorrectly</i> at a much higher
      rate than most people realise – the text “feels” right but contains inaccurate information.</p>
      <ul>
        <li>For example: false information about building regulations, planning law, accessibility or
        sustainability criteria, design specifications, etc, will lead to the practice bearing the risk and
        liability for any resulting issues.</li>
      </ul>
      <p>Staff must follow all existing procedures and policies and embrace a culture of critical judgement and
      quality review. When planning any use of generative AI to produce output, the required time and effort
      to check for accuracy and bias, and edit as necessary, should be accounted for.</p>
      <ul>
        <li>A common temptation is to consider using AI generation in tasks or situations where there may be a
        significant or unusual time pressure, for example a tight deadline or late submission. Be aware that
        this is where such risks are greater, and checking output is more likely to be missed or ignored. This
        should never be an excuse for skipping review and checking. Consider alternative approaches or
        adjusting expectations for time required to check output.</li>
      </ul>
      <p>Quality assurance procedures and policies continue to hold for all project activities.</p>
      <p>Failure to do this may break a key requirement in our codes of practice with both the RIBA and ARB,
      and lead to liability under our contractual appointments with our clients, including to use “reasonable
      skill and care” in providing our services.</p>`,
  },
  {
    id: "reliability",
    type: "static",
    render: () => 
      
      `
        <p>DO: Review all outputs for accuracy. AI can and does produce hallucinations.</p>
        <p>DO: Check facts against reliable sources, particularly for technical, financial, or client-facing
        work.</p>
        <p>DO: Correct any errors or inaccuracies yourself.</p>
        <p>DON'T: Prompt AI to fix its own errors or inaccuracies.</p>
        <p>DON'T: Share AI output “as is” in external communications.</p>
        `
    ,
  },
  {
    id: "clientCommunication",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Client Communication and Consent</h2>
      <p>We are transparent and communicate with clients about <strong>if</strong>, <strong>how</strong>, and
      <strong>why</strong> we use AI to deliver projects.</p>`,
  },
  euAiActWatermarkingBlock(),
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
      It's often tricky to quantify the carbon footprint associated with generative AI usage, however there is ongoing research to do so by RIBA and others.
      <br/><br/>
      Bear in mind that single prompts to chatbots may appear to have a very small carbon footprint; however, an agent or loop approach could lead to
      many thousands or even millions of "tokens" used by the generative AI service, each of which represent energy and resource implications.
    `,
    render: sustainabilityRender,
  },
  {
    id: "roleDisplacement",
    type: "static",
    guidanceText: "",
    render: () =>
      `<h2>Role Displacement</h2>
      <p>We commit to not using adoption of AI technologies as a reason, excuse or strategy for role
      displacement or staff reductions.</p>`,
  },
];
