/**
 * BMC Official Seal — stylized SVG recreation of the
 * Brihanmumbai Municipal Corporation crest.
 *
 * Features the four quadrants representing Mumbai's identity:
 *  - Gateway of India (top-left, white on red)
 *  - Cogwheel/Industry (top-right, white on blue)
 *  - Maritime (bottom-left, white on blue)
 *  - Heritage tower (bottom-right, white on red)
 * Surmounted by a lion and the motto "यतो धर्मस्ततो जयः"
 * (Where there is righteousness, there is victory).
 */

interface BMCSealProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'minimal' | 'mono';
}

export default function BMCSeal({ size = 80, className = '', variant = 'full' }: BMCSealProps) {
  if (variant === 'minimal') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BMC Seal"
      >
        <defs>
          <radialGradient id="bmc-min-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fdf8ec" />
            <stop offset="100%" stopColor="#f3e2b9" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#bmc-min-bg)" stroke="#b27e2a" strokeWidth="2" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#b27e2a" strokeWidth="0.5" />
        {/* Four quadrants */}
        <path d="M 50 50 L 50 12 A 38 38 0 0 0 12 50 Z" fill="#c8202d" />
        <path d="M 50 50 L 88 50 A 38 38 0 0 0 50 12 Z" fill="#1a4080" />
        <path d="M 50 50 L 50 88 A 38 38 0 0 0 88 50 Z" fill="#c8202d" />
        <path d="M 50 50 L 12 50 A 38 38 0 0 0 50 88 Z" fill="#1a4080" />
        {/* Center golden ring */}
        <circle cx="50" cy="50" r="8" fill="#d29944" stroke="#8a6020" strokeWidth="0.8" />
      </svg>
    );
  }

  if (variant === 'mono') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BMC Seal (mono)"
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.6" />
        <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="0.8" />
        <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="6" fill="currentColor" />
        <text
          x="50"
          y="98"
          textAnchor="middle"
          fontSize="6"
          fill="currentColor"
          fontFamily="serif"
          fontWeight="600"
        >
          BMC
        </text>
      </svg>
    );
  }

  // Full variant — stylized representation of the official seal
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Brihanmumbai Municipal Corporation Seal"
    >
      <defs>
        <radialGradient id="bmc-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf8ec" />
          <stop offset="70%" stopColor="#f3e2b9" />
          <stop offset="100%" stopColor="#ecd193" />
        </radialGradient>
        <linearGradient id="bmc-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0b766" />
          <stop offset="50%" stopColor="#d29944" />
          <stop offset="100%" stopColor="#b27e2a" />
        </linearGradient>
        <linearGradient id="bmc-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d63341" />
          <stop offset="100%" stopColor="#9c1822" />
        </linearGradient>
        <linearGradient id="bmc-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2056a0" />
          <stop offset="100%" stopColor="#0f244a" />
        </linearGradient>
      </defs>

      {/* Outer cream ring */}
      <circle cx="100" cy="100" r="98" fill="url(#bmc-bg)" stroke="url(#bmc-gold)" strokeWidth="2.5" />

      {/* Decorative outer scrollwork ring */}
      <circle cx="100" cy="100" r="92" fill="none" stroke="url(#bmc-gold)" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="url(#bmc-gold)" strokeWidth="0.4" opacity="0.6" />

      {/* Hindi text arc top - "बृहन्मुंबई महानगरपालिका" representation as decorative dots */}
      <g opacity="0.85">
        {Array.from({ length: 32 }).map((_, i) => {
          const angle = -150 + (i * (120 / 31));
          const rad = (angle * Math.PI) / 180;
          const x = 100 + Math.cos(rad) * 86;
          const y = 100 + Math.sin(rad) * 86;
          return (
            <circle key={`top-${i}`} cx={x} cy={y} r="0.8" fill="#9c1822" />
          );
        })}
      </g>

      {/* English text arc bottom - "Brihanmumbai Municipal Corporation" */}
      <g opacity="0.85">
        {Array.from({ length: 32 }).map((_, i) => {
          const angle = 30 + (i * (120 / 31));
          const rad = (angle * Math.PI) / 180;
          const x = 100 + Math.cos(rad) * 86;
          const y = 100 + Math.sin(rad) * 86;
          return (
            <circle key={`bot-${i}`} cx={x} cy={y} r="0.8" fill="#1a4080" />
          );
        })}
      </g>

      {/* Lion at top */}
      <g transform="translate(100, 38)">
        <ellipse cx="0" cy="0" rx="9" ry="6" fill="url(#bmc-gold)" stroke="#8a6020" strokeWidth="0.4" />
        <circle cx="-3" cy="-2" r="1" fill="#5c4216" />
        <circle cx="3" cy="-2" r="1" fill="#5c4216" />
        <path d="M -2 2 Q 0 4 2 2" stroke="#5c4216" strokeWidth="0.6" fill="none" strokeLinecap="round" />
        {/* Mane suggestion */}
        <path d="M -8 -3 Q -10 -6 -8 -8 M 8 -3 Q 10 -6 8 -8 M -5 -7 Q -4 -10 -2 -8 M 5 -7 Q 4 -10 2 -8" stroke="url(#bmc-gold)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Central shield with 4 quadrants */}
      <g transform="translate(100, 105)">
        {/* Shield outline */}
        <path
          d="M -32 -25 L 32 -25 L 32 12 Q 32 25 0 35 Q -32 25 -32 12 Z"
          fill="url(#bmc-gold)"
          stroke="#8a6020"
          strokeWidth="1"
        />

        {/* Inner shield (slightly smaller) */}
        <path
          d="M -28 -21 L 28 -21 L 28 11 Q 28 22 0 31 Q -28 22 -28 11 Z"
          fill="#fff"
          stroke="#8a6020"
          strokeWidth="0.4"
        />

        {/* Quadrant divisions */}
        <line x1="-28" y1="-5" x2="28" y2="-5" stroke="#8a6020" strokeWidth="0.4" />
        <line x1="0" y1="-21" x2="0" y2="31" stroke="#8a6020" strokeWidth="0.4" />

        {/* TL: Gateway of India (red) */}
        <rect x="-28" y="-21" width="28" height="16" fill="url(#bmc-red)" />
        <g transform="translate(-14, -13)">
          <rect x="-6" y="-2" width="12" height="6" fill="#fff" />
          <path d="M -6 -2 L -4 -6 L 4 -6 L 6 -2 Z" fill="#fff" />
          <rect x="-1.5" y="-1" width="3" height="3" fill="url(#bmc-red)" />
        </g>

        {/* TR: Cogwheel/Industry (blue) */}
        <rect x="0" y="-21" width="28" height="16" fill="url(#bmc-blue)" />
        <g transform="translate(14, -13)">
          <circle cx="0" cy="0" r="4" fill="#fff" />
          <circle cx="0" cy="0" r="1.8" fill="url(#bmc-blue)" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <rect
                key={deg}
                x="-0.8"
                y="-5.5"
                width="1.6"
                height="2"
                fill="#fff"
                transform={`rotate(${deg})`}
              />
            );
          })}
        </g>

        {/* BL: Maritime (blue with waves) */}
        <rect x="-28" y="-5" width="28" height="16" fill="url(#bmc-blue)" />
        <g transform="translate(-14, 3)">
          <path d="M -8 0 Q -6 -2 -4 0 T 0 0 T 4 0 T 8 0" stroke="#fff" strokeWidth="0.8" fill="none" />
          <path d="M -8 3 Q -6 1 -4 3 T 0 3 T 4 3 T 8 3" stroke="#fff" strokeWidth="0.8" fill="none" />
          {/* Boat */}
          <path d="M -3 -3 L 3 -3 L 2 -1 L -2 -1 Z" fill="#fff" />
          <line x1="0" y1="-3" x2="0" y2="-6" stroke="#fff" strokeWidth="0.6" />
        </g>

        {/* BR: Heritage tower (red) */}
        <rect x="0" y="-5" width="28" height="16" fill="url(#bmc-red)" />
        <g transform="translate(14, 3)">
          <rect x="-3" y="-4" width="6" height="6" fill="#fff" />
          <rect x="-1" y="-7" width="2" height="3" fill="#fff" />
          <circle cx="0" cy="-7.5" r="0.8" fill="#fff" />
          <rect x="-4" y="2" width="8" height="1.5" fill="#fff" />
        </g>
      </g>

      {/* Bottom motto banner */}
      <g transform="translate(100, 158)">
        <path
          d="M -22 -3 L 22 -3 L 20 4 L -20 4 Z"
          fill="url(#bmc-gold)"
          stroke="#8a6020"
          strokeWidth="0.4"
        />
        <text x="0" y="1" textAnchor="middle" fontSize="4.5" fill="#5c4216" fontFamily="serif" fontWeight="600" fontStyle="italic">
          यतो धर्मस्ततो जयः
        </text>
      </g>
    </svg>
  );
}
