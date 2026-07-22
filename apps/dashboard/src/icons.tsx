type IconProps = { className?: string };

export function IconHome({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M2.5 7.5L8 2.5l5.5 5V13a.5.5 0 01-.5.5H10v-3.5H6V13.5H3a.5.5 0 01-.5-.5V7.5z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="6" cy="5.5" r="2.25" />
      <path d="M2 13.5c0-2.2 2.2-3.5 4-3.5s4 1.3 4 3.5" strokeLinecap="round" />
      <circle cx="11.5" cy="6" r="1.75" />
      <path d="M11.5 9.5c1.8 0 3.5.9 3.5 2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconRefresh({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M13 4.5A5.5 5.5 0 003.5 6M3 11.5A5.5 5.5 0 0012.5 10" strokeLinecap="round" />
      <path d="M1 6l2.5-1.5L5 6M11 10l2.5 1.5L16 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconInvoice({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M4 1.5h8a1 1 0 011 1v11.5l-3.5-1.2L6 14V2.5a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M6 5.5h4M6 8h4M6 10.5h2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M2 13.5V2.5M2 13.5h12" strokeLinecap="round" />
      <rect x="4" y="8" width="2" height="5.5" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="7.5" y="5.5" width="2" height="8" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="11" y="3" width="2" height="10.5" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconProduct({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M8 1.5L2.5 4.5v7L8 14.5l5.5-3v-7L8 1.5z" strokeLinejoin="round" />
      <path d="M8 1.5v13M2.5 4.5l5.5 3 5.5-3" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  );
}

export function IconLogo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 28 28" width="28" height="28">
      <rect width="28" height="28" rx="7" fill="#f97316" />
      <path
        d="M16.5 6.5L9 14h4.5L11.5 21.5 19 14h-4.5L16.5 6.5z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCopy({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M4 2h7a1 1 0 011 1v1h1a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-1H4a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v7h7V4H5zm-2 2h1v5a1 1 0 001 1h5v1H3a1 1 0 01-1-1V4z" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M6.5 11.5L3 8l1.1-1.1 2.4 2.4 5.4-5.4L13 5.1 6.5 11.5z" />
    </svg>
  );
}

export function IconDollar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5v7M6.5 6.5c0-.8.7-1.5 1.5-1.5s1.5.5 1.5 1.5-.7 1.5-1.5 1.5-1.5.5-1.5 1.5.7 1.5 1.5 1.5 1.5-.5 1.5-1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M6 2.5H3.5a1 1 0 00-1 1v9a1 1 0 001 1H6" strokeLinecap="round" />
      <path d="M10.5 5.5L14 8l-3.5 2.5M14 8H6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

export function IconKey({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <circle cx="5.5" cy="10.5" r="3" />
      <path d="M8 8l6.5-6.5M12 2.5h2.5V5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconWebhook({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M4 6.5a4 4 0 018 0" strokeLinecap="round" />
      <path d="M2 9.5a7 7 0 0112 0" strokeLinecap="round" />
      <circle cx="8" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
