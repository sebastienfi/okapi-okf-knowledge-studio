export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="var(--k-brand)" strokeWidth="2.6" strokeLinecap="round">
        <path d="M32 30 L18 18" opacity="0.9" />
        <path d="M32 30 L46 18" opacity="0.9" />
        <path d="M32 30 L20 46" opacity="0.7" />
        <path d="M32 30 L44 46" opacity="0.7" />
        <path d="M20 46 L44 46" opacity="0.45" />
      </g>
      <g fill="var(--k-brand)">
        <circle cx="18" cy="18" r="5" />
        <circle cx="46" cy="18" r="5" />
        <circle cx="20" cy="46" r="4" />
        <circle cx="44" cy="46" r="4" />
      </g>
      <circle cx="32" cy="30" r="7.5" fill="var(--k-brand)" opacity="0.55" />
      <circle cx="32" cy="30" r="3.4" fill="var(--k-canvas)" />
    </svg>
  );
}
