/**
 * BMC Official Seal - renders the actual Brihanmumbai Municipal
 * Corporation logo from /public/bmc_logo.png.
 *
 * The earlier version of this component synthesised a stylised SVG
 * approximation of the seal; that didn't match the official BMC
 * branding the SWM Department uses on their letterhead, so we now
 * serve the real PNG. The component API (size, className, variant)
 * is unchanged, so every consumer picks up the new rendering with
 * no further edits.
 *
 * Variants:
 *   - full     ▸ the canonical coloured logo (default)
 *   - minimal  ▸ same image, used at smaller sizes; identical pixels
 *   - mono     ▸ single-colour SVG outline for monochrome contexts
 *               (print fallback, single-ink letterheads). Falls back
 *               to currentColor so it adapts to its container's text
 *               colour.
 */

interface BMCSealProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'minimal' | 'mono';
}

export default function BMCSeal({ size = 80, className = '', variant = 'full' }: BMCSealProps) {
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

  // Full and minimal variants both render the actual logo. The image
  // is served by Next from /public so it works identically in dev
  // and on the Vercel deployment.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/bmc_logo.png"
      alt="Brihanmumbai Municipal Corporation"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}
