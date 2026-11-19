// Logo EMCV (concept « Lumière » : croix dorée dans le C), repris de l'artefact.
export function Logo({ couleur = 'var(--side-ink)', className }: { couleur?: string; className?: string }) {
  return (
    <svg viewBox="-6 -6 662 176" role="img" aria-label="EMCV" className={className}>
      <g fill="none" strokeWidth="28" strokeLinejoin="miter" strokeMiterlimit="2.5" style={{ stroke: couleur }}>
        <path d="M100 14 H14 V146 H100" /><path d="M14 80 H84" /><path d="M154 160 V14 L215 110 L276 14 V160" />
        <path d="M440.6 37.6 A66 66 0 1 0 440.6 122.4" /><path d="M510 14 L575 152 L640 14" />
      </g>
      <g fill="none" strokeWidth="11" style={{ stroke: 'var(--gold)' }}><path d="M452 54 V106" /><path d="M436 70 H468" /></g>
    </svg>
  );
}
