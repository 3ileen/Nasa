/**
 * NinaWillay logo (public/ninawillay-logo.svg): orbit and satellite around a flame.
 * Drawn inline so the orbit takes the theme blue (--marca-azul) and reads well in both
 * dark and light mode; the flame keeps its oranges in both.
 */
export function LogoNinaWillay({ className }: { className?: string | undefined }) {
  return (
    <svg className={className} viewBox="0 0 120 108" aria-hidden focusable="false">
      <ellipse
        cx="60"
        cy="64"
        rx="52"
        ry="18"
        transform="rotate(-24 60 64)"
        fill="none"
        stroke="var(--marca-azul)"
        strokeWidth="5"
      />
      <g transform="translate(30 14) scale(.6)">
        <path
          d="M50 6 C58 24 80 36 80 60 C80 80 66 94 50 94 C34 94 20 80 20 60 C20 46 28 38 34 30 C36 40 42 44 46 44 C44 30 44 18 50 6 Z"
          fill="#f97316"
        />
        <path
          d="M50 46 C56 58 66 64 66 76 C66 86 59 92 50 92 C41 92 34 86 34 76 C34 66 44 60 50 46Z"
          fill="#fdba74"
        />
      </g>
      <path
        d="M12 82 C40 100 92 84 110 46"
        fill="none"
        stroke="var(--marca-azul)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="108" cy="50" r="7" fill="var(--marca-azul)" />
      <circle cx="108" cy="50" r="2.8" fill="var(--menu)" />
    </svg>
  );
}
