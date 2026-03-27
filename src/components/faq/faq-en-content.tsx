import Link from "next/link";

import { FaqUserCategoriesSection } from "@/components/faq/faq-user-categories-section";
import {
  FaqCallout,
  FaqFootnote,
  FaqStepCardList,
  FaqTocChips,
  FaqVisualCardList,
} from "@/components/faq/faq-visual";

const toc = [
  { id: "overview", label: "Programme & process" },
  { id: "booking-logic", label: "How booking works" },
  { id: "how-system", label: "Using the system" },
  { id: "fair-use", label: "Fair use" },
  { id: "user-types", label: "User categories" },
  { id: "social-bonus", label: "Social & referrals" },
  { id: "room-rules", label: "Studio rules" },
  { id: "notes", label: "Other notes" },
] as const;

export function FaqEnContent() {
  return (
    <main className="mx-auto max-w-3xl px-5 sm:px-4 py-12 pb-24">
      <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">Frequently asked questions (FAQ)</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        Quick guide to the booking platform, <strong className="font-medium text-stone-800 dark:text-stone-200">Fantasia Music Space</strong>{" "}
        rules, and <strong className="text-stone-800 dark:text-stone-200">social / referral</strong> requirements. If anything differs from the
        organiser&apos;s latest notices, the organiser prevails.
      </p>

      <FaqTocChips ariaLabel="On this page" heading="Contents" items={toc} />

      <div className="mt-12 space-y-14 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <section id="overview" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">Programme &amp; process overview</h2>
          <FaqVisualCardList
            items={[
              {
                variant: "teal",
                icon: "spark",
                title: "Limited-time free studio access",
                tags: ["D Festival × Fantasia Music Space", "Sponsored programme", "Local practitioners & learners"],
                blurb: "Space for practice, try-outs, rehearsal and recording prep, plus related course and performance information.",
              },
              {
                variant: "violet",
                icon: "calendar",
                title: "Campaign window (example)",
                tags: ["3 Apr–3 May 2026", "3 Apr: 11:00–20:00", "Other days: 06:00–20:00", "Hong Kong time"],
              },
              {
                variant: "sky",
                icon: "arrows",
                title: "Two steps to take part",
                tags: ["① Register & create account", "② Book after the published opening time"],
              },
            ]}
          />
          <FaqCallout>
            <strong>Important:</strong> you will receive a <strong>confirmation email</strong> after registering or booking; in normal circumstances
            you may use the facilities as confirmed. The organiser may still <strong>change or cancel</strong> bookings. Room bookings do{" "}
            <strong>not</strong> need a separate manual approval step before they are confirmed.
          </FaqCallout>
        </section>

        <section id="booking-logic" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">How booking works</h2>
          <FaqVisualCardList
            items={[
              {
                variant: "teal",
                icon: "envelope",
                title: "After you book → confirmation email",
                tags: ["Sent by the system"],
              },
              {
                variant: "emerald",
                icon: "shield",
                title: "Attend as confirmed",
                tags: ["Date & time", "Follow venue rules"],
              },
              {
                variant: "amber",
                icon: "scale",
                title: "Organiser discretion",
                tags: ["May change or cancel bookings"],
              },
            ]}
          />
        </section>

        <section id="how-system" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">How the system works</h2>
          <FaqStepCardList
            steps={[
              {
                title: "Registration & account",
                blurb: "Your email is your sign-in ID. Check your inbox for a temporary password and change it soon after first login.",
              },
              {
                title: "Booking opens",
                blurb: "The home page shows the organiser’s published opening time. Once open, sign in, pick slots, and submit.",
              },
              {
                title: "Before you visit",
                blurb: "Use the studio at the confirmed time. View bookings in your account and follow the studio rules below.",
              },
            ]}
          />
          <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <Link
              href="/register"
              className="text-stone-900 underline decoration-stone-400 underline-offset-2 dark:text-stone-50"
            >
              Register
            </Link>
            <span className="text-stone-400" aria-hidden>
              ·
            </span>
            <Link
              href="/login"
              className="text-stone-900 underline decoration-stone-400 underline-offset-2 dark:text-stone-50"
            >
              Sign in
            </Link>
            <span className="text-stone-400" aria-hidden>
              ·
            </span>
            <Link href="/" className="text-stone-900 underline decoration-stone-400 underline-offset-2 dark:text-stone-50">
              Home
            </Link>
          </p>
        </section>

        <section id="fair-use" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">Fair use</h2>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Principles in brief; final decisions rest with the organiser.</p>
          <FaqVisualCardList
            items={[
              {
                variant: "teal",
                icon: "scale",
                title: "Match what you declared",
                tags: ["Category, purpose, availability"],
                blurb: "The organiser may schedule, verify, or adjust bookings. Clear mismatch or harm to others may mean refusal or cancellation.",
              },
              {
                variant: "violet",
                icon: "userCheck",
                title: "Once confirmed",
                tags: ["Confirmation email"],
                blurb: "The slot is normally yours; overall capacity limits still apply.",
              },
              {
                variant: "stone",
                icon: "gavel",
                title: "Organiser’s final say",
                tags: ["Categories, allocation, changes"],
              },
              {
                variant: "sky",
                icon: "hand",
                title: "Honest registration",
                tags: ["Choose the right user category"],
              },
              {
                variant: "rose",
                icon: "clock",
                title: "Punctuality & no-shows",
                tags: ["Respect confirmed time"],
                blurb: "Repeated no-shows or wasted slots may affect future eligibility under organiser policy.",
              },
            ]}
          />
        </section>

        <FaqUserCategoriesSection locale="en" />

        <section id="social-bonus" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">
            Social participation <span className="text-stone-600 dark:text-stone-400">&amp; referrals</span>
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            The <strong>free experience</strong> requires <strong>following the official accounts</strong> and{" "}
            <strong>reposting the designated posts with tags</strong>. These steps do <strong>not</strong> earn extra booking slots or bonus
            sessions.
          </p>
          <FaqVisualCardList
            className="mt-5"
            items={[
              {
                variant: "violet",
                icon: "heart",
                title: "1. Follow the official accounts",
                tags: ["Instagram + Facebook", "All three accounts"],
                blurb: (
                  <>
                    <p>After registration, open each official link as guided on the site; at the venue, be ready to show “following” screens.</p>
                    <ul className="mt-2 list-none space-y-1 p-0 text-stone-600 dark:text-stone-400">
                      <li className="flex gap-2">
                        <span className="text-teal-600 dark:text-teal-400" aria-hidden>
                          ●
                        </span>
                        <span>D Festival Young Pianist Program</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-teal-600 dark:text-teal-400" aria-hidden>
                          ●
                        </span>
                        <span>Fantasia Music Space</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-teal-600 dark:text-teal-400" aria-hidden>
                          ●
                        </span>
                        <span>Hong Kong Fantasia International Music Management Ltd.</span>
                      </li>
                    </ul>
                  </>
                ),
              },
              {
                variant: "sky",
                icon: "arrowPath",
                title: "2. Repost the designated posts",
                tags: ["Two D Festival posts", "Story or feed", "Tag both brands on IG & FB"],
                blurb: (
                  <>
                    Must be the organiser&apos;s <strong className="text-stone-800 dark:text-stone-200">designated posts</strong>;{" "}
                    <strong className="text-stone-800 dark:text-stone-200">keep proof</strong> for verification.
                  </>
                ),
              },
              {
                variant: "amber",
                icon: "gift",
                title: "3. D-Ambassador referral benefits",
                tags: ["Separate from follow / repost", "Referral rewards"],
                blurb: (
                  <>
                    <p>
                      Join as a <strong className="text-stone-800 dark:text-stone-200">D Ambassador</strong> (opt in at registration or under{" "}
                      <strong className="text-stone-800 dark:text-stone-200">My account</strong>), share your{" "}
                      <strong className="text-stone-800 dark:text-stone-200">personal link / QR</strong>. You earn rewards when someone{" "}
                      <strong className="text-stone-800 dark:text-stone-200">completes a new registration via your link</strong> and you stay
                      eligible (subject to organiser verification).
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-semibold text-stone-50 dark:bg-stone-100 dark:text-stone-900">
                        +1 × 30 min per referral
                      </span>
                      <span className="rounded-lg border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
                        Up to 25 slots (25 successful referrals)
                      </span>
                      <span className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 dark:border-stone-600 dark:text-stone-300">
                        Non-transferable · No cash value
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                      <strong className="text-stone-700 dark:text-stone-300">Referees</strong> receive 50% off the{" "}
                      <strong className="text-stone-700 dark:text-stone-300">D Festival</strong> application fee and 50% off the{" "}
                      <strong className="text-stone-700 dark:text-stone-300">D Masters</strong> preliminary application fee. Promo codes are sent
                      automatically to the referee. All extra time slots must be used{" "}
                      <strong className="text-stone-700 dark:text-stone-300">after 3 May 2026</strong>. After this free experience programme ends, the
                      organiser will progressively notify users who earned extra Time Slots when they may book.
                    </p>
                  </>
                ),
              },
            ]}
          />
          <FaqFootnote>
            Registration requires ticking follow-and-repost commitments; verification and eligibility follow the organiser and event terms.
          </FaqFootnote>
        </section>

        <section id="room-rules" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">Studio rules (Fantasia Music Space)</h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">Key points before you enter — protect the equipment and other users.</p>
          <FaqVisualCardList
            items={[
              {
                variant: "teal",
                icon: "shoe",
                title: "Entry & hygiene",
                tags: ["Remove shoes", "Sanitise hands", "If shoes required: spray soles first"],
              },
              {
                variant: "orange",
                icon: "ban",
                title: "Food & cleanliness",
                tags: ["No eating or drinking", "Plain water OK", "No litter left behind"],
              },
              {
                variant: "violet",
                icon: "music",
                title: "Piano & music stand",
                tags: ["No objects on piano or stand", "Sheet music OK", "No alcohol wipes on piano", "No eraser on stand", "Don’t mark house scores"],
              },
              {
                variant: "sky",
                icon: "speaker",
                title: "Conduct, valuables & exit",
                tags: ["No rough play or loud noise", "Keep belongings with you", "Report damage", "Lights / AC / audio off when leaving"],
              },
              {
                variant: "stone",
                icon: "building",
                title: "Use of the room",
                tags: ["Music-related use only", "No windows / extra lids without permission", "Don’t remove venue items"],
              },
            ]}
          />
        </section>

        <section id="notes" className="scroll-mt-24">
          <h2 className="font-serif text-xl text-stone-900 dark:text-stone-50">Other notes</h2>
          <FaqVisualCardList
            items={[
              {
                variant: "stone",
                icon: "info",
                title: "What prevails",
                tags: ["Emails", "On-site notices", "Staff instructions"],
                blurb: "If they conflict with this FAQ, follow those sources.",
              },
              {
                variant: "sky",
                icon: "refresh",
                title: "Site content changes",
                tags: ["Opening times", "Selectable slots"],
                blurb: "Follow the latest display on the site.",
              },
              {
                variant: "teal",
                icon: "envelope",
                title: "Keep email accurate",
                tags: ["Temporary password", "Notifications"],
                blurb: "Check spam folders too.",
              },
              {
                variant: "violet",
                icon: "shield",
                title: "Terms & privacy",
                blurb: "Contact the organiser / Fantasia Music Space using their latest published channels.",
              },
            ]}
          />
        </section>
      </div>
    </main>
  );
}
