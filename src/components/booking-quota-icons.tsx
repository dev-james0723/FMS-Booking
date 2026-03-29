/** Decorative icons for booking quota / identity UI (stroke-based, theme-aware). */

export function BookingIconPerson({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M6 20.25v-.75c0-2.75 2.25-5 6-5s6 2.25 6 5v.75" />
    </svg>
  );
}

/** Teacher-sized figure beside a smaller student (shared individual-quota tier). */
export function BookingIconMentorStudent({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="8" cy="7.5" r="2.35" />
      <path d="M4 20.25v-.85c0-2.15 1.65-3.9 4-3.9s4 1.75 4 3.9v.85" />
      <circle cx="17" cy="9" r="1.85" />
      <path d="M14.25 20.25v-.75c0-1.45 1.05-2.65 2.75-2.65s2.75 1.2 2.75 2.65v.75" />
    </svg>
  );
}

/** Account with both individual and teaching eligibility: teaching numeric caps apply. */
export function BookingIconDualQuotaTier({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="8" cy="8.25" r="2.35" />
      <path d="M4.25 20.25v-.75c0-2.35 1.9-4.25 4.75-4.25s4.75 1.9 4.75 4.25v.75" />
      <rect x="13.5" y="4.5" width="8" height="6.25" rx="0.65" />
      <path d="M15.25 7h4.5M15.25 8.65h3.5" opacity={0.4} />
      <path d="M17.5 10.75V20" />
      <path d="M15 20h5" />
    </svg>
  );
}

/** Teaching / with-students (teaching quota tier): board + instructor. */
export function BookingIconTeaching({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2.5" y="4.5" width="12.5" height="9" rx="0.75" />
      <path d="M6.5 8.25h5M6.5 10.5h4" opacity={0.4} />
      <path d="M15.5 7.5l5.5 3v4l-5.5 3" />
      <circle cx="9.5" cy="18" r="1.5" />
      <path d="M6 22.25v-.4c0-1.15 1-2.1 3.5-2.1s3.5.95 3.5 2.1v.4" />
    </svg>
  );
}

export function BookingIconCalendarRolling({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.25h17" />
      <path d="M8 3.5v3M16 3.5v3" />
      <rect x="6" y="12" width="3.5" height="2.8" rx="0.4" fill="currentColor" opacity={0.22} />
      <rect x="10.25" y="12" width="3.5" height="2.8" rx="0.4" fill="currentColor" opacity={0.22} />
      <rect x="14.5" y="12" width="3.5" height="2.8" rx="0.4" fill="currentColor" opacity={0.22} />
    </svg>
  );
}

export function BookingIconSlot30({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7v5.25l3.5 2" />
    </svg>
  );
}

export function BookingIconCooldown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 3.5h8v3H8z" />
      <path d="M9 6.5v2.5c-2.2 1.4-3.5 3.8-3.5 6.5a7.5 7.5 0 1015 0c0-2.7-1.3-5.1-3.5-6.5V6.5" />
      <path d="M12 10v5l3 2" opacity={0.45} />
    </svg>
  );
}

export function BookingIconIdentityPick({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="8" cy="9" r="2.5" />
      <path d="M4 18.5v-.4c0-1.8 1.5-3.3 4-3.3s4 1.5 4 3.3v.4" />
      <circle cx="17" cy="10" r="2.2" />
      <path d="M13.5 18.5v-.35c0-1.5 1.2-2.75 3.5-2.75s3.5 1.25 3.5 2.75v.35" />
      <path d="M12 5.5l1.75-1.75L12 2" />
    </svg>
  );
}

export function BookingIconSingleBucket({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9h12l-1.2 10.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 9z" />
      <path d="M5 9V7.5a2 2 0 012-2h10a2 2 0 012 2V9" />
      <path d="M9 5.5V4a1 1 0 011-1h4a1 1 0 011 1v1.5" />
    </svg>
  );
}

export function BookingIconCampaignRange({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 9.5h18" />
      <path d="M8 3v2.5M16 3v2.5" />
      <path d="M7 14.5h10" />
      <path d="M8 18.5h8" opacity={0.45} />
    </svg>
  );
}
