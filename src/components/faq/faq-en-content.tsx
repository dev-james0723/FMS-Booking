import Link from "next/link";

const toc = [
  { id: "overview", label: "Programme & process overview" },
  { id: "how-system", label: "How the system works" },
  { id: "fair-use", label: "Fair use & approvals" },
  { id: "user-types", label: "User categories" },
  { id: "social-bonus", label: "Social participation (follow & repost)" },
  { id: "room-rules", label: "Studio rules (Fantasia Music Space)" },
  { id: "notes", label: "Other notes" },
] as const;

export function FaqEnContent() {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12 pb-24">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">Frequently asked questions (FAQ)</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        This page summarises how the booking platform works, together with{" "}
        <strong className="font-medium text-stone-800 dark:text-stone-200">Fantasia Music Space</strong> studio rules
        and <strong className="text-stone-800 dark:text-stone-200">social participation requirements</strong>. If
        anything differs from the organiser&apos;s latest notices, the organiser prevails.
      </p>

      <nav
        aria-label="On this page"
        className="mt-8 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/80 dark:bg-stone-900/80 px-5 sm:px-4 py-4 text-sm"
      >
        <p className="font-medium text-stone-800 dark:text-stone-200">Contents</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-stone-600 dark:text-stone-400">
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-stone-700 dark:text-stone-300 underline decoration-stone-300 underline-offset-2 hover:text-stone-900 dark:text-stone-50">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-14 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <section id="overview" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">Programme & process overview</h2>
          <p className="mt-3">
            The <strong>D Festival Young Pianist Program</strong> and <strong>Fantasia Music Space</strong> jointly
            present this <strong>limited-time free piano studio experience</strong>, sponsored by Hong Kong Fantasia
            International Music Management Ltd., for local music practitioners and learners.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Dedicated space for <strong>personal practice, try-outs, audition prep, pre-recording run-throughs,
              creation</strong> and other music-related uses, with introductions to related D Festival courses and
              performance opportunities.
            </li>
            <li>
              Dates and hours follow organiser announcements (for example within{" "}
              <strong>3 April–3 May 2026</strong>: 3 Apr 11:00–20:00, all other campaign days 06:00–20:00, Hong Kong
              time).
            </li>
            <li>
              The platform uses <strong>two steps</strong>: first complete <strong>registration &amp; account
              creation</strong>, then submit a formal booking after the <strong>published booking opening time</strong>.
            </li>
          </ul>
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
            <strong>Important:</strong> completing registration or submitting a request <strong>does not</strong> mean a
            studio slot is approved; the outcome depends on review and any further notices from the organiser.
          </p>
        </section>

        <section id="how-system" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">How the system works</h2>
          <ol className="mt-4 list-decimal space-y-4 pl-5">
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Registration &amp; account</strong>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                Complete <strong>Register &amp; create account</strong> and submit. Your <strong>email</strong> is your
                sign-in ID; we send a <strong>temporary password</strong> (check your inbox and change the password
                soon after first login).
              </p>
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Booking opens</strong>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                Booking turns on after the <strong>organiser&apos;s published opening time</strong> (shown on the home
                page). Once open, sign in, pick slots on the booking page, and submit.
              </p>
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Review &amp; outcomes</strong>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                After you submit, status may show as pending review; once approved, waitlisted, or declined, you can
                see records in your account. If email notifications are enabled, messages go to your registered email.
              </p>
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Before you attend</strong>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                If approved, use the studio on the confirmed date and time and follow venue rules, including the
                &quot;Studio rules&quot; section below.
              </p>
            </li>
          </ol>
          <p className="mt-4">
            <Link href="/register" className="text-stone-900 dark:text-stone-50 underline decoration-stone-400 underline-offset-2 hover:decoration-stone-600">
              Go to registration &amp; create account
            </Link>
            {" · "}
            <Link href="/login" className="text-stone-900 dark:text-stone-50 underline decoration-stone-400 underline-offset-2 hover:decoration-stone-600">
              Sign in
            </Link>
            {" · "}
            <Link href="/" className="text-stone-900 dark:text-stone-50 underline decoration-stone-400 underline-offset-2 hover:decoration-stone-600">
              Back to home
            </Link>
          </p>
        </section>

        <section id="fair-use" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">Fair use &amp; approvals</h2>
          <p className="mt-3">
            To share limited free slots fairly, the organiser applies the following principles (subject to final
            organiser decisions):
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Match declared use:</strong> review considers your
              stated <strong>purposes, user category</strong>, and <strong>availability / preferences</strong>, plus
              remaining capacity and overall scheduling.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">No automatic first-come guarantee:</strong> the
              system may use a booking workflow; <strong>a successful submit does not reserve the slot</strong> until
              approved.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Organiser discretion:</strong> Fantasia Music Space
              / the organiser may make final decisions on <strong>categories, allocation, approval / waitlist /
              decline</strong> and overall arrangements without publishing internal ranking details.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Honest declarations:</strong> choose categories such
              as individual or teaching truthfully; misrepresentation or harm to others may lead to refusal or
              cancellation of approved slots.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Punctuality &amp; no-shows:</strong> respect
              assigned time; repeated no-shows or waste of resources may affect future eligibility per organiser policy.
            </li>
          </ul>
        </section>

        <section id="user-types" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">User categories (same as registration)</h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            Pick the option that best matches how you will use the studio so the organiser can review fairly:
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-3">
              <h3 className="font-medium text-stone-900 dark:text-stone-50">Individual user</h3>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                Use in an <strong>individual</strong> capacity—for example personal practice, try-outs, audition prep,
                competition recording, rehearsal, composition, trying the instrument. Typically suited to{" "}
                <strong>students, performers, freelancers</strong>, and similar.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-surface px-5 sm:px-4 py-3">
              <h3 className="font-medium text-stone-900 dark:text-stone-50">Teaching / with students</h3>
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                Use involving <strong>teaching or bringing students</strong>, for example lessons, accompanying students,
                try-outs, helping students record. Typically suited to <strong>private teachers and tutors</strong>.
              </p>
            </div>
          </div>
        </section>

        <section id="social-bonus" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
            Social participation <span className="text-stone-600 dark:text-stone-400">follow &amp; repost</span>
          </h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            To take part in this <strong>free experience</strong>, eligible participants must complete both:{" "}
            <strong>follow the designated official accounts</strong> and{" "}
            <strong>repost the organiser&apos;s specified posts tagging the official accounts</strong>. Doing so{" "}
            <strong>does not</strong> grant extra booking slots, bonus sessions, or rewards; free-experience quotas and
            approvals still follow event terms and organiser arrangements (see on-site notices for details).
          </p>

          <div className="mt-8 space-y-8">
            <article className="rounded-xl border border-violet-200 bg-violet-50/60 px-5 sm:px-4 py-4">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">1. Follow the official accounts</h3>
              <p className="mt-2 text-stone-700 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-stone-50">How:</strong> on <strong>Instagram</strong> and{" "}
                <strong>Facebook</strong>, follow the three accounts listed below. After registration, the site will guide
                you to open each official link for your records; when visiting the venue, be ready to show
                &quot;following&quot; screens if staff ask.
              </p>
              <p className="mt-3 text-sm font-medium text-stone-800 dark:text-stone-200">
                Designated accounts (follow on both IG and FB):
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-stone-700 dark:text-stone-300">
                <li>D Festival Young Pianist Program</li>
                <li>Fantasia Music Space</li>
                <li>Hong Kong Fantasia International Music Management Ltd.</li>
              </ol>
            </article>

            <article className="rounded-xl border border-sky-200 bg-sky-50/60 px-5 sm:px-4 py-4">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">2. Repost the designated posts</h3>
              <p className="mt-2 text-stone-700 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-stone-50">How:</strong> repost the two designated{" "}
                <strong>D Festival Young Pianist Program</strong> promotional posts to your personal{" "}
                <strong>Instagram</strong> or <strong>Facebook</strong> story or feed, and tag{" "}
                <strong>D Festival Young Pianist Program</strong> and <strong>Fantasia Music Space</strong> on{" "}
                <strong>Instagram and Facebook</strong>.
              </p>
              <div className="mt-4 rounded-lg border border-stone-200 dark:border-stone-700 bg-surface px-3 py-3 text-sm text-stone-600 dark:text-stone-400">
                <p className="font-medium text-stone-800 dark:text-stone-200">Notes</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5">
                  <li>
                    Reposts must be the organiser&apos;s <strong>designated campaign posts</strong>.
                  </li>
                  <li>
                    <strong>Keep proof of reposts</strong> in case the organiser asks to verify.
                  </li>
                </ul>
              </div>
            </article>

            <article className="rounded-xl border border-amber-200 bg-amber-50/50 px-5 sm:px-4 py-4 dark:border-amber-800/50 dark:bg-amber-950/30">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50">3. Follow-up offers after the experience</h3>
              <p className="mt-2 text-stone-700 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-stone-50">How:</strong> after your{" "}
                <strong>first free experience</strong>, you may receive Fantasia Music Space{" "}
                <strong>paid-studio rental benefits</strong> according to organiser arrangements.
              </p>
              <p className="mt-2 text-stone-700 dark:text-stone-300">
                <strong className="text-stone-900 dark:text-stone-50">What&apos;s included:</strong> for example voucher-style
                rental discounts (value, conditions, validity) follow <strong>the organiser&apos;s latest notices and
                on-site briefings</strong>; if this page conflicts with flyers or terms, the organiser prevails.
              </p>
            </article>
          </div>

          <p className="mt-6 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800/80 px-3 py-2 text-xs text-stone-600 dark:text-stone-400">
            Registration requires ticking commitments to follow and repost; whether requirements are met is subject to
            organiser verification and event terms.
          </p>
        </section>

        <section id="room-rules" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">Studio rules (Fantasia Music Space)</h2>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            Please read and follow these rules before entering the studio to protect the equipment, other users, and
            your safety.
          </p>
          <ol className="mt-6 list-decimal space-y-4 pl-5 marker:font-medium marker:text-stone-800 dark:text-stone-200">
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Before entering:</strong>
              please <strong>remove shoes</strong> and <strong>sanitise your hands</strong> before going in.
              <span className="mt-2 block rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
                <strong>Note:</strong> if an exam or filming requires <strong>wearing shoes</strong>,{" "}
                <strong>spray-disinfect the soles</strong> before entering.
              </span>
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Food &amp; drink:</strong>{" "}
              <strong>no eating or drinking</strong> inside (<strong>plain water excepted</strong>).
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Cleanliness:</strong> do not leave food packaging,
              lunch boxes, or drink containers in the room.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Belongings:</strong> do not place personal items on
              the <strong>piano or music stand</strong> (<strong>sheet music excepted</strong>).
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Cleaning the piano:</strong> do not use{" "}
              <strong>alcohol wipes</strong> on the piano case or keys.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Music stand:</strong> do not use{" "}
              <strong>eraser</strong> on the piano music stand.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Conduct:</strong> no{" "}
              <strong>running, rough play, or loud noise</strong> in the room.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Valuables:</strong> keep belongings with you; the
              venue cannot be responsible for loss.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Care of facilities:</strong> treat equipment with
              care; you may be charged for damage.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Energy &amp; exit:</strong> before leaving, switch off{" "}
              <strong>lights, air conditioning, audio</strong>, and other powered devices.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Permitted use:</strong> the room is for{" "}
              <strong>music-related activities</strong> only unless otherwise permitted.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Windows &amp; lids:</strong> do not open{" "}
              <strong>windows</strong> or grand-piano lids other than the <strong>front lid</strong> without permission.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Waste:</strong> keep the room tidy; use in-room bins
              or take litter away so others are not affected.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">House sheet music:</strong> you may use in-room scores
              but do not <strong>deface or write on them</strong>.
            </li>
            <li>
              <strong className="text-stone-900 dark:text-stone-50">Venue property:</strong> do not remove any venue items
              from the room.
            </li>
          </ol>
        </section>

        <section id="notes" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">Other notes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              This FAQ explains general platform and venue rules; if emails, on-site notices, or staff instructions
              conflict, those prevail.
            </li>
            <li>
              Opening times, booking windows, and selectable slots shown in the system may change; follow the latest
              website display.
            </li>
            <li>
              Keep your registered email correct for temporary passwords and notifications (check spam folders).
            </li>
            <li>
              For questions on terms, personal data, or programme details, contact the organiser / Fantasia Music Space
              support using the organiser&apos;s latest published channels.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
