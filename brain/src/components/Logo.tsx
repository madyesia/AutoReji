/** AutoReji marka işareti — yağmur damlası + film/diyafram motifi, amber degrade. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg-a" x1="6" y1="3" x2="26" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-amber-200)" />
          <stop offset="0.55" stopColor="var(--color-amber-400)" />
          <stop offset="1" stopColor="var(--color-amber-600)" />
        </linearGradient>
        <linearGradient id="lg-b" x1="8" y1="8" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-ink-900)" />
          <stop offset="1" stopColor="var(--color-ink-800)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="url(#lg-b)" stroke="url(#lg-a)" strokeOpacity="0.5" strokeWidth="1.2" />
      {/* yağmur damlası gövdesi */}
      <path d="M16 7.5c3.4 3.8 5.6 6.8 5.6 9.9a5.6 5.6 0 1 1-11.2 0c0-3.1 2.2-6.1 5.6-9.9Z" fill="url(#lg-a)" />
      {/* iç parıltı / play üçgeni */}
      <path d="M14.4 14.6l4.1 2.5-4.1 2.5v-5Z" fill="var(--color-ink-900)" fillOpacity="0.85" />
    </svg>
  )
}
