import type { LegalSection } from "@/lib/legal/types";

export const privacyTitleEn = "Privacy policy";

export const privacyIntroEn =
  "This policy explains how the “D Festival × Fantasia Music Space” limited-time free piano studio booking website (the “Site” or the “Service”) collects, uses, discloses, stores, retains and protects your personal data. We know users care about what is actually stored, why it is needed, how long it is kept, who can access it, and how you can exercise rights such as access and correction. The sections below set this out in plain language, grouped by activity. By using the Site you acknowledge this policy and agree to the processing described (including, where applicable, consent you give by ticking checkboxes). If you do not agree, please do not use the Site. This policy is designed to help you make an informed choice; it is not legal advice. If you need advice on your specific situation, you should consult an independent professional.";

export const privacySectionsEn: LegalSection[] = [
  {
    heading: "1. Data controller and scope",
    paragraphs: [
      "The Site is operated for registration, account management, booking workflows and related administration by the organiser / operator (including the D Festival Young Pianist Program, Fantasia Music Space and their designated technical, administrative and support teams). For the purposes of the Personal Data (Privacy) Ordinance (Cap. 486) (“PDPO”), the data user who determines how your personal data is processed is as published by the organiser from time to time (name, address and contact channels); this policy will be updated accordingly.",
      "This policy applies to personal data you provide or generate through the Site and linked account features (e.g. bookings after sign-in, account settings, password reset, passkey binding). If you interact with the organiser through third-party platforms (e.g. social networks), those platforms’ policies may also apply; this policy covers processing carried out through the Service only.",
    ],
  },
  {
    heading: "2. Personal data we collect (by feature)",
    paragraphs: [
      "To make our processing transparent, the following describes categories of data by what you do on the Site. Not every item applies to every user; the actual scope depends on whether you register, book, or use optional features.",
    ],
  },
  {
    heading: "2.1 Registration, account and profile",
    paragraphs: [
      "When you create an account or complete programme registration we may collect and store: Chinese name; English name (if provided); email address (often used as the sign-in identifier); phone number; age; whether you were recommended by a teacher and related teacher name/contact (if you choose to provide them); user category (e.g. individual vs teaching use); instrument or musical field; identity selections (multi-choice plus free-text where you pick “other”); intended uses of the studio (multi-choice and notes); initial booking preferences (preferred dates, preferred time bands, free-text notes).",
      "We may also record optional interests (e.g. information about D Festival or D Masters), marketing opt-ins, ambassador / sharing preferences, and checkboxes relating to commitments such as following official social accounts or reposting designated posts. We use this information to understand participants, operate the programme and bookings, verify compliance with organiser rules, and—where you have agreed—to contact you about the programme or related offers.",
      "The system may retain submission records (e.g. snapshots of data submitted at the time of registration and technical identifiers used to prevent duplicate submissions) for audit, dispute resolution and service improvement.",
    ],
  },
  {
    heading: "2.2 SMS verification",
    paragraphs: [
      "To verify phone numbers, reduce duplicate sign-ups and strengthen account security, we send one-time codes by SMS. Related processing includes storing codes in hashed or one-way form (not retaining full plaintext codes indefinitely), logging verification attempts, and recording verification outcomes and challenge expiry times.",
      "Messages are delivered through telecommunications / cloud messaging providers (e.g. Twilio or similar). Those providers necessarily process your phone number and message content in transit. We use contractual or equivalent measures requiring them to process data only as needed for delivery and to maintain confidentiality and security.",
    ],
  },
  {
    heading: "2.3 Passwords and passkeys (WebAuthn / Face ID / fingerprint, etc.)",
    paragraphs: [
      "If you set a password, we store a one-way password hash—not your plaintext password. If you use passkeys (e.g. Face ID, Touch ID, Windows Hello or a hardware security key), we store technical data required by the WebAuthn standard, such as credential identifiers, public keys, signature counters and, where applicable, transport hints.",
      "Important: biometric templates (e.g. fingerprint or face maps) are generally held on your device or by the operating system. Our servers store cryptographic verification data and cannot reconstruct your fingerprint or face image from that data alone. Before registration is finalised, pre-registration passkey data and challenges may be held temporarily with expiry.",
    ],
  },
  {
    heading: "2.4 Bookings, slots and related records",
    paragraphs: [
      "When you use booking features we process data such as: request timestamps; requested or assigned slots; booking status (pending, approved, waitlisted, cancelled, no-show, completed, etc.); internal administrative notes where used; whether a request uses a bonus or promotional slot; and logs of status changes (including the type of actor, e.g. system, user or admin). We use this data to operate the booking service, allocate capacity fairly, enforce no-show or suspension policies, and for internal audit.",
    ],
  },
  {
    heading: "2.5 Social steps, verification and optional uploads",
    paragraphs: [
      "Where the programme requires following official accounts or reposting content, we may record in-Site actions (e.g. whether you opened official profile links from the Site) and declarations that you completed required steps. If the organiser allows or requires screenshots, links or other evidence, that content may be stored for review. Please do not include sensitive personal data in evidence that is not needed for verification.",
    ],
  },
  {
    heading: "2.6 Avatars and optional image features (may involve third-party AI)",
    paragraphs: [
      "If you use optional avatar features (e.g. icon preferences or generated images), we may store your choices and outputs (which may include image data or URLs). If images are generated via a third-party generative AI service (e.g. Google Gemini APIs), prompts or related parameters may be transmitted to that provider, which is governed by its own terms and privacy policy. You may avoid that processing by not using the optional feature.",
    ],
  },
  {
    heading: "2.7 Email and delivery logs",
    paragraphs: [
      "When we send system emails we process your address and delivery metadata (e.g. template type, status, provider message IDs). Delivery may be performed by cloud email providers (e.g. Resend or similar).",
    ],
  },
  {
    heading: "2.8 Technical data, cookies and logs",
    paragraphs: [
      "When you browse or use the Site, servers or applications may automatically collect technical data such as IP address, browser type and version, device type, operating system, visit time, requested pages or API paths, error logs and referrers. We may use cookies, local storage or similar technologies for sign-in state, language or UI preferences (e.g. dark mode), abuse prevention and analytics.",
      "Registration submissions may record source IP addresses to help prevent abuse, fraud or automated attacks. If you disable cookies, some features (e.g. staying signed in) may not work correctly.",
    ],
  },
  {
    heading: "3. Purposes of processing",
    paragraphs: [
      "We use personal data only where it is lawful, fair and proportionate. In summary, purposes include:",
      "(a) Performing our relationship with you: creating and managing accounts, processing registration, providing bookings and related notices, enforcing programme rules;",
      "(b) Authentication and security: phone verification, passwords and passkeys, detecting and preventing unauthorised access, duplicate sign-ups, automation abuse or attacks;",
      "(c) Communications: important messages about your account, bookings or the programme; where you have consented and the law allows, promotional or programme updates;",
      "(d) Event and venue operations: capacity and scheduling, on-site or administrative coordination, handling no-shows, suspensions or termination;",
      "(e) Verifying eligibility for community or bonus requirements where applicable;",
      "(f) Complying with law, regulation, tax or lawful requests from authorities, or establishing, exercising or defending legal claims;",
      "(g) Internal audit, analytics, service improvement and security monitoring (using aggregated or de-identified information where practicable);",
      "(h) Other purposes for which we obtain separate consent (e.g. optional surveys or trials).",
    ],
  },
  {
    heading: "4. Legal basis and consent",
    paragraphs: [
      "Under the PDPO framework we may rely on: your consent (e.g. marketing, non-essential cookies or analytics, optional AI features); processing necessary to perform the service you request; legitimate interests (e.g. maintaining security, preventing fraud, improving the Service) where we consider those interests are not overridden by your rights; and legal obligation.",
      "Where processing is based on consent, you may withdraw it; we may then be unable to provide features that depend on that consent, without affecting the lawfulness of processing before withdrawal (as allowed by law). Where data is strictly necessary for core registration or booking, you may not be able to use those features without providing it.",
    ],
  },
  {
    heading: "5. Disclosure, transfers and processors",
    paragraphs: [
      "We do not sell your personal data. We disclose or allow access only:",
      "(a) To processors / service providers: e.g. cloud hosting, database hosting, email and SMS delivery, security monitoring, support tooling, error tracking, backups, and AI providers for optional features—under contracts limiting use to what is necessary and requiring confidentiality and security;",
      "(b) To affiliated entities or partners where needed to run the programme, venues or joint initiatives, subject to internal data-handling rules;",
      "(c) To regulators, courts or law enforcement where required by law or where we reasonably believe disclosure is necessary to establish, exercise or defend legal rights;",
      "(d) In connection with a merger, acquisition or asset sale; we will require successors to honour this policy or give you reasonable notice.",
      "If data is transferred outside Hong Kong (e.g. to servers in other jurisdictions), we take reasonable steps required by applicable law, including contractual safeguards where appropriate.",
    ],
  },
  {
    heading: "6. Retention",
    paragraphs: [
      "We keep personal data only as long as needed for the purposes above, and may extend retention where required for legal or accounting obligations, ongoing disputes or complaints, or fraud prevention. In general: account and profile data is kept while the account exists; booking and programme records may be kept for a reasonable period after the campaign to handle follow-up, audit or disputes; SMS and passkey challenge data is short-lived and purged on a schedule; log retention depends on security and operational needs.",
      "When data is no longer required we delete or destroy it, or where not feasible anonymise or aggregate it so it no longer identifies you.",
    ],
  },
  {
    heading: "7. Security",
    paragraphs: [
      "We implement reasonable technical and organisational measures to reduce the risk of unauthorised or accidental access, loss, alteration or destruction. These may include (depending on deployment): encryption in transit (HTTPS), role-based access controls, password hashing, auditing of administrative actions, vendor security reviews and staff training.",
      "No internet transmission or electronic storage is completely secure. You are responsible for safeguarding credentials, changing temporary passwords promptly, not staying signed in on shared devices, and notifying us promptly of suspected unauthorised use.",
    ],
  },
  {
    heading: "8. Access, correction and complaints",
    paragraphs: [
      "Where the PDPO applies, you may have the right to request access to personal data we hold about you and to request correction of inaccurate data. You may also raise questions or complaints about our practices. Please use the channels published on the Contact page; we may need to verify your identity first.",
      "If you believe we have breached the PDPO, you may complain to the Office of the Privacy Commissioner for Personal Data, Hong Kong (PCPD), using their published contact details.",
    ],
  },
  {
    heading: "9. Children and young people",
    paragraphs: [
      "The Service is not directed at children under 13 and we do not knowingly collect their personal data. If you are a parent or guardian and believe we have collected a child’s data without awareness, please contact us so we can delete it where the law allows. Where teenagers may participate, we encourage guardians to review this policy with them.",
    ],
  },
  {
    heading: "10. Third-party sites and social media",
    paragraphs: [
      "The Site may link to third-party websites including social platforms operated independently. Their privacy practices may differ. Activity on those platforms (e.g. public posts, usernames) is governed by their rules and is outside the scope of this policy.",
    ],
  },
  {
    heading: "11. Changes",
    paragraphs: [
      "We may update this policy to reflect legal, technical or business changes. The current version will be posted on this page. For material changes we will provide notice on the Site, by email or other reasonable means. Continued use after changes may constitute acceptance of the updated policy (where the law allows).",
    ],
  },
  {
    heading: "12. Contact",
    paragraphs: [
      "For questions about this policy, access or correction requests, or our data practices, please contact the organiser via the Contact page; the organiser’s published contact details prevail.",
    ],
  },
];
