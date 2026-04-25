/**
 * Domain illustrations for SWRMS — waste collection, sanitation
 * workers, Mumbai cityscape, route maps. Hand-crafted SVG that
 * evokes the BMC operational context, not a generic SaaS product.
 */

interface IllustrationProps {
  className?: string;
  size?: number;
}

/**
 * BMCHeritageBuilding — line drawing of the iconic
 * Brihanmumbai Municipal Corporation HQ (Indo-Saracenic style,
 * central tower with onion dome, flanking spires, arched arcades,
 * statue of "Urbs Prima in Indis" on the central facade).
 *
 * Built as a single-color stroked SVG so it works as a watermark
 * in any color (just set className text-color).
 */
export function BMCHeritageBuilding({ className = '' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 480"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* ── Ground line ─────────────────────────────── */}
      <line x1="0" y1="470" x2="800" y2="470" strokeWidth="1.5" />

      {/* ── Left side wing ─────────────────────────── */}
      <g>
        {/* Main mass */}
        <rect x="80" y="280" width="180" height="190" />
        {/* Roofline crenellations */}
        <line x1="80" y1="280" x2="260" y2="280" strokeWidth="1.5" />
        <line x1="80" y1="275" x2="260" y2="275" />
        {/* Window arches row 1 (lower) */}
        <g strokeWidth="0.9">
          {[100, 132, 164, 196, 228].map((x) => (
            <g key={`l1-${x}`}>
              <path d={`M ${x} 430 Q ${x} 410 ${x + 14} 410 Q ${x + 28} 410 ${x + 28} 430 Z`} />
              <line x1={x + 14} y1="410" x2={x + 14} y2="430" />
            </g>
          ))}
        </g>
        {/* Window arches row 2 (middle) */}
        <g strokeWidth="0.9">
          {[100, 132, 164, 196, 228].map((x) => (
            <g key={`l2-${x}`}>
              <path d={`M ${x} 380 Q ${x} 358 ${x + 14} 358 Q ${x + 28} 358 ${x + 28} 380 Z`} />
              <line x1={x + 14} y1="358" x2={x + 14} y2="380" />
            </g>
          ))}
        </g>
        {/* Window arches row 3 (upper) */}
        <g strokeWidth="0.9">
          {[100, 132, 164, 196, 228].map((x) => (
            <path key={`l3-${x}`} d={`M ${x} 320 Q ${x} 300 ${x + 14} 300 Q ${x + 28} 300 ${x + 28} 320 Z`} />
          ))}
        </g>
        {/* Floor divider lines */}
        <line x1="80" y1="343" x2="260" y2="343" strokeWidth="0.8" />
        <line x1="80" y1="395" x2="260" y2="395" strokeWidth="0.8" />
      </g>

      {/* ── Left flanking tower (small dome) ──────── */}
      <g>
        <rect x="240" y="220" width="56" height="220" />
        {/* Dome base */}
        <rect x="232" y="208" width="72" height="14" />
        {/* Onion dome */}
        <path d="M 240 208 Q 240 175 250 165 Q 256 158 268 158 Q 280 158 286 165 Q 296 175 296 208" strokeWidth="1.3" />
        {/* Dome ribs */}
        <line x1="252" y1="170" x2="252" y2="208" strokeWidth="0.6" />
        <line x1="268" y1="158" x2="268" y2="208" strokeWidth="0.6" />
        <line x1="284" y1="170" x2="284" y2="208" strokeWidth="0.6" />
        {/* Spire on dome */}
        <line x1="268" y1="158" x2="268" y2="142" strokeWidth="1.5" />
        <circle cx="268" cy="142" r="3" />
        <line x1="268" y1="139" x2="268" y2="130" strokeWidth="0.8" />
        {/* Tower window */}
        <rect x="252" y="270" width="32" height="30" />
        <line x1="268" y1="270" x2="268" y2="300" strokeWidth="0.6" />
        <line x1="252" y1="285" x2="284" y2="285" strokeWidth="0.6" />
        {/* Tower arches */}
        <path d="M 252 360 Q 252 340 268 340 Q 284 340 284 360 Z" />
        <path d="M 252 410 Q 252 390 268 390 Q 284 390 284 410 Z" />
      </g>

      {/* ── CENTRAL TOWER (the iconic one) ─────────── */}
      <g>
        {/* Central mass base */}
        <rect x="320" y="260" width="160" height="210" />

        {/* Triangular pediment with statue */}
        <path d="M 320 260 L 400 200 L 480 260 Z" strokeWidth="1.3" />
        {/* Pediment inner line */}
        <path d="M 332 256 L 400 210 L 468 256" strokeWidth="0.7" />

        {/* Statue niche on pediment */}
        <g transform="translate(400, 240)">
          <ellipse cx="0" cy="-3" rx="3" ry="4" />
          <line x1="0" y1="1" x2="0" y2="11" strokeWidth="1.4" />
          <line x1="0" y1="3" x2="-5" y2="7" strokeWidth="0.7" />
          <line x1="0" y1="3" x2="5" y2="7" strokeWidth="0.7" />
          <line x1="-3" y1="11" x2="-3" y2="18" strokeWidth="1" />
          <line x1="3" y1="11" x2="3" y2="18" strokeWidth="1" />
        </g>

        {/* Sign band */}
        <rect x="335" y="265" width="130" height="10" strokeWidth="0.8" />

        {/* Central tower body (above pediment, the main rising tower) */}
        <rect x="350" y="120" width="100" height="80" strokeWidth="1.3" />
        {/* Sub-pediment trim */}
        <rect x="345" y="118" width="110" height="4" />
        {/* Tower windows (vertical narrow arched) */}
        <g strokeWidth="0.9">
          <path d="M 365 175 Q 365 145 375 145 Q 385 145 385 175 Z" />
          <path d="M 395 175 Q 395 145 405 145 Q 415 145 415 175 Z" />
          <path d="M 425 175 Q 425 145 435 145 Q 445 145 445 175 Z" />
        </g>

        {/* Tower upper section (where the dome sits) */}
        <rect x="362" y="78" width="76" height="44" strokeWidth="1.3" />
        {/* Clock face */}
        <circle cx="400" cy="100" r="14" strokeWidth="1.2" />
        <circle cx="400" cy="100" r="11" strokeWidth="0.6" />
        {/* Clock hands */}
        <line x1="400" y1="100" x2="400" y2="92" strokeWidth="1" />
        <line x1="400" y1="100" x2="406" y2="103" strokeWidth="1" />
        <circle cx="400" cy="100" r="1.2" fill="currentColor" stroke="none" />
        {/* Clock tick marks */}
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 400 + Math.cos(rad) * 12;
          const y1 = 100 + Math.sin(rad) * 12;
          const x2 = 400 + Math.cos(rad) * 14;
          const y2 = 100 + Math.sin(rad) * 14;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.7" />;
        })}

        {/* Dome base / drum */}
        <rect x="356" y="60" width="88" height="20" strokeWidth="1.2" />
        {/* Decorative mini-arches on drum */}
        <g strokeWidth="0.6">
          {[366, 380, 394, 408, 422, 436].map((x, i) => (
            <path key={i} d={`M ${x} 78 Q ${x} 68 ${x + 6} 68 Q ${x + 12} 68 ${x + 12} 78`} />
          ))}
        </g>

        {/* MAIN ONION DOME */}
        <path d="M 360 60 Q 360 25 380 12 Q 400 0 420 0 Q 420 0 440 12 Q 460 25 460 60" strokeWidth="1.6" />
        {/* Dome ribs (vertical detail lines) */}
        <line x1="378" y1="15" x2="378" y2="60" strokeWidth="0.7" />
        <line x1="395" y1="6" x2="395" y2="60" strokeWidth="0.7" />
        <line x1="410" y1="0" x2="410" y2="60" strokeWidth="0.7" />
        <line x1="425" y1="6" x2="425" y2="60" strokeWidth="0.7" />
        <line x1="442" y1="15" x2="442" y2="60" strokeWidth="0.7" />

        {/* Main spire on top of dome */}
        <line x1="410" y1="0" x2="410" y2="-32" strokeWidth="2" />
        <circle cx="410" cy="-12" r="4" strokeWidth="1.2" />
        <circle cx="410" cy="-22" r="2" strokeWidth="1" />
        <line x1="410" y1="-32" x2="410" y2="-42" strokeWidth="0.8" />
        <path d="M 405 -38 L 410 -42 L 415 -38" strokeWidth="0.8" />

        {/* Lower main facade arches */}
        <g strokeWidth="0.9">
          <path d="M 332 425 Q 332 395 346 395 Q 360 395 360 425 Z" />
          <line x1="346" y1="395" x2="346" y2="425" />
          <path d="M 372 425 Q 372 395 386 395 Q 400 395 400 425 Z" />
          <line x1="386" y1="395" x2="386" y2="425" />
          <path d="M 412 425 Q 412 395 426 395 Q 440 395 440 425 Z" />
          <line x1="426" y1="395" x2="426" y2="425" />
          <path d="M 452 425 Q 452 395 466 395 Q 478 395 478 425" />
          <line x1="466" y1="395" x2="466" y2="425" />
        </g>

        {/* Floor divider on main facade */}
        <line x1="320" y1="380" x2="480" y2="380" strokeWidth="0.8" />

        {/* Secondary windows (round) on main facade */}
        <g strokeWidth="0.9">
          <circle cx="346" cy="345" r="9" />
          <circle cx="386" cy="345" r="9" />
          <circle cx="426" cy="345" r="9" />
          <circle cx="466" cy="345" r="9" />
          {/* Crosses inside (window mullions) */}
          <line x1="337" y1="345" x2="355" y2="345" strokeWidth="0.5" />
          <line x1="346" y1="336" x2="346" y2="354" strokeWidth="0.5" />
          <line x1="377" y1="345" x2="395" y2="345" strokeWidth="0.5" />
          <line x1="386" y1="336" x2="386" y2="354" strokeWidth="0.5" />
          <line x1="417" y1="345" x2="435" y2="345" strokeWidth="0.5" />
          <line x1="426" y1="336" x2="426" y2="354" strokeWidth="0.5" />
          <line x1="457" y1="345" x2="475" y2="345" strokeWidth="0.5" />
          <line x1="466" y1="336" x2="466" y2="354" strokeWidth="0.5" />
        </g>

        {/* Decorative cornice */}
        <line x1="320" y1="318" x2="480" y2="318" strokeWidth="0.6" />
      </g>

      {/* ── Right flanking tower (mirror of left) ───── */}
      <g>
        <rect x="504" y="220" width="56" height="220" />
        <rect x="496" y="208" width="72" height="14" />
        <path d="M 504 208 Q 504 175 514 165 Q 520 158 532 158 Q 544 158 550 165 Q 560 175 560 208" strokeWidth="1.3" />
        <line x1="516" y1="170" x2="516" y2="208" strokeWidth="0.6" />
        <line x1="532" y1="158" x2="532" y2="208" strokeWidth="0.6" />
        <line x1="548" y1="170" x2="548" y2="208" strokeWidth="0.6" />
        <line x1="532" y1="158" x2="532" y2="142" strokeWidth="1.5" />
        <circle cx="532" cy="142" r="3" />
        <line x1="532" y1="139" x2="532" y2="130" strokeWidth="0.8" />
        <rect x="516" y="270" width="32" height="30" />
        <line x1="532" y1="270" x2="532" y2="300" strokeWidth="0.6" />
        <line x1="516" y1="285" x2="548" y2="285" strokeWidth="0.6" />
        <path d="M 516 360 Q 516 340 532 340 Q 548 340 548 360 Z" />
        <path d="M 516 410 Q 516 390 532 390 Q 548 410 548 410 Z" />
      </g>

      {/* ── Right wing (mirror of left) ─────────────── */}
      <g>
        <rect x="540" y="280" width="180" height="190" />
        <line x1="540" y1="280" x2="720" y2="280" strokeWidth="1.5" />
        <line x1="540" y1="275" x2="720" y2="275" />
        <g strokeWidth="0.9">
          {[560, 592, 624, 656, 688].map((x) => (
            <g key={`r1-${x}`}>
              <path d={`M ${x} 430 Q ${x} 410 ${x + 14} 410 Q ${x + 28} 410 ${x + 28} 430 Z`} />
              <line x1={x + 14} y1="410" x2={x + 14} y2="430" />
            </g>
          ))}
        </g>
        <g strokeWidth="0.9">
          {[560, 592, 624, 656, 688].map((x) => (
            <g key={`r2-${x}`}>
              <path d={`M ${x} 380 Q ${x} 358 ${x + 14} 358 Q ${x + 28} 358 ${x + 28} 380 Z`} />
              <line x1={x + 14} y1="358" x2={x + 14} y2="380" />
            </g>
          ))}
        </g>
        <g strokeWidth="0.9">
          {[560, 592, 624, 656, 688].map((x) => (
            <path key={`r3-${x}`} d={`M ${x} 320 Q ${x} 300 ${x + 14} 300 Q ${x + 28} 300 ${x + 28} 320 Z`} />
          ))}
        </g>
        <line x1="540" y1="343" x2="720" y2="343" strokeWidth="0.8" />
        <line x1="540" y1="395" x2="720" y2="395" strokeWidth="0.8" />
      </g>

      {/* ── Lampposts and street furniture suggestion ── */}
      <g strokeWidth="1.2">
        <line x1="40" y1="470" x2="40" y2="380" />
        <circle cx="40" cy="376" r="4" />
        <line x1="760" y1="470" x2="760" y2="380" />
        <circle cx="760" cy="376" r="4" />
      </g>
    </svg>
  );
}

/**
 * MumbaiSkyline — stylized line illustration of Mumbai's
 * iconic skyline (BMC HQ, Gateway of India, modern towers,
 * Bandra-Worli Sea Link suggestion).
 */
export function MumbaiSkyline({ className = '' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 240"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYEnd meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
        </linearGradient>
        <pattern id="windows" x="0" y="0" width="6" height="8" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="2" height="3" fill="currentColor" opacity="0.25" />
        </pattern>
      </defs>

      {/* Background fade */}
      <rect width="800" height="240" fill="url(#sky-fade)" />

      {/* Sea Link suspension cables (left horizon) */}
      <g stroke="currentColor" strokeWidth="0.8" opacity="0.4">
        <line x1="0" y1="190" x2="120" y2="120" />
        <line x1="20" y1="190" x2="120" y2="125" />
        <line x1="40" y1="190" x2="120" y2="130" />
        <line x1="60" y1="190" x2="120" y2="135" />
        <line x1="80" y1="190" x2="120" y2="140" />
        <line x1="100" y1="190" x2="120" y2="145" />
        {/* Tower */}
        <line x1="120" y1="195" x2="120" y2="100" strokeWidth="1.5" />
        <line x1="130" y1="195" x2="130" y2="105" strokeWidth="1.5" />
      </g>

      {/* Modern apartment towers (left-center) */}
      <g fill="currentColor" opacity="0.55">
        <rect x="160" y="80" width="32" height="160" />
        <rect x="195" y="100" width="28" height="140" />
        <rect x="226" y="60" width="36" height="180" />
      </g>
      <g fill="url(#windows)">
        <rect x="160" y="80" width="32" height="160" />
        <rect x="195" y="100" width="28" height="140" />
        <rect x="226" y="60" width="36" height="180" />
      </g>

      {/* BMC HQ — Indo-Saracenic style central building */}
      <g fill="currentColor" opacity="0.7">
        {/* Main mass */}
        <rect x="290" y="120" width="100" height="120" />
        {/* Center clock tower */}
        <rect x="328" y="55" width="24" height="185" />
        <polygon points="328,55 340,30 352,55" />
        <circle cx="340" cy="73" r="6" fill="white" stroke="currentColor" strokeWidth="1.5" />
        {/* Side domes */}
        <ellipse cx="305" cy="120" rx="14" ry="18" />
        <rect x="298" y="115" width="14" height="8" />
        <ellipse cx="375" cy="120" rx="14" ry="18" />
        <rect x="368" y="115" width="14" height="8" />
        {/* Decorative arches */}
        <rect x="295" y="160" width="14" height="40" rx="7" fill="white" opacity="0.4" />
        <rect x="320" y="160" width="14" height="40" rx="7" fill="white" opacity="0.4" />
        <rect x="345" y="160" width="14" height="40" rx="7" fill="white" opacity="0.4" />
        <rect x="370" y="160" width="14" height="40" rx="7" fill="white" opacity="0.4" />
      </g>

      {/* Gateway of India suggestion (right of BMC) */}
      <g fill="currentColor" opacity="0.55">
        <rect x="420" y="150" width="60" height="90" />
        {/* Main arch */}
        <path d="M 432 150 Q 432 120 450 120 Q 468 120 468 150 Z" fill="white" opacity="0.5" stroke="currentColor" strokeWidth="1" />
        {/* Side spires */}
        <rect x="416" y="135" width="6" height="105" />
        <rect x="478" y="135" width="6" height="105" />
        <polygon points="416,135 419,128 422,135" />
        <polygon points="478,135 481,128 484,135" />
      </g>

      {/* More residential towers (right) */}
      <g fill="currentColor" opacity="0.55">
        <rect x="510" y="90" width="34" height="150" />
        <rect x="548" y="115" width="26" height="125" />
        <rect x="578" y="70" width="40" height="170" />
        <rect x="622" y="105" width="30" height="135" />
      </g>
      <g fill="url(#windows)">
        <rect x="510" y="90" width="34" height="150" />
        <rect x="548" y="115" width="26" height="125" />
        <rect x="578" y="70" width="40" height="170" />
        <rect x="622" y="105" width="30" height="135" />
      </g>

      {/* Industrial chimneys (far right - RCF/Trombay reference) */}
      <g stroke="currentColor" strokeWidth="3" fill="none" opacity="0.45">
        <line x1="680" y1="240" x2="680" y2="120" />
        <line x1="710" y1="240" x2="710" y2="135" />
        <line x1="740" y1="240" x2="740" y2="150" />
      </g>
      <g fill="currentColor" opacity="0.3">
        <ellipse cx="680" cy="115" rx="6" ry="3" />
        <ellipse cx="710" cy="130" rx="5" ry="2.5" />
        <ellipse cx="740" cy="145" rx="4" ry="2" />
      </g>

      {/* Ground line */}
      <line x1="0" y1="240" x2="800" y2="240" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

/**
 * WasteCollectionTruck — line-drawn illustration of a BMC waste collection vehicle.
 */
export function WasteCollectionTruck({ className = '' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 140"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="truck-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2056a0" />
          <stop offset="100%" stopColor="#143164" />
        </linearGradient>
        <linearGradient id="truck-cab" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a7bc1" />
          <stop offset="100%" stopColor="#1a4080" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="120" cy="125" rx="100" ry="4" fill="#000" opacity="0.1" />

      {/* Container/skip on back */}
      <rect x="80" y="40" width="115" height="65" fill="url(#truck-body)" stroke="#0a1832" strokeWidth="1.5" />
      <rect x="80" y="40" width="115" height="6" fill="#d29944" />
      {/* Container ribs */}
      <line x1="105" y1="50" x2="105" y2="100" stroke="#0a1832" strokeWidth="0.8" opacity="0.5" />
      <line x1="135" y1="50" x2="135" y2="100" stroke="#0a1832" strokeWidth="0.8" opacity="0.5" />
      <line x1="165" y1="50" x2="165" y2="100" stroke="#0a1832" strokeWidth="0.8" opacity="0.5" />

      {/* Recycle symbol on container */}
      <g transform="translate(137, 70)">
        <circle cx="0" cy="0" r="14" fill="#fff" opacity="0.95" />
        <g stroke="#15803d" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <path d="M -5 -3 L 0 -7 L 5 -3" />
          <path d="M 6 1 L 4 7 L -3 7" />
          <path d="M -7 4 L -3 -2" />
          <polygon points="-7,4 -10,3 -8,7" fill="#15803d" />
          <polygon points="6,1 9,2 8,-2" fill="#15803d" />
          <polygon points="-3,7 -1,9 -3,11" fill="#15803d" />
        </g>
      </g>

      {/* Cab */}
      <path d="M 30 60 L 80 60 L 80 105 L 30 105 Q 25 105 25 100 L 25 80 Q 25 60 30 60 Z" fill="url(#truck-cab)" stroke="#0a1832" strokeWidth="1.5" />
      {/* Windshield */}
      <path d="M 32 65 L 78 65 L 78 78 L 32 78 Z" fill="#c2d0e7" stroke="#0a1832" strokeWidth="0.8" opacity="0.85" />
      {/* Door divider */}
      <line x1="55" y1="78" x2="55" y2="105" stroke="#0a1832" strokeWidth="0.8" opacity="0.5" />
      {/* Door handle */}
      <rect x="68" y="89" width="6" height="2" fill="#0a1832" opacity="0.7" />

      {/* BMC label on door */}
      <text x="42" y="95" fontSize="6" fontWeight="700" fill="#fff" fontFamily="sans-serif">BMC</text>
      <text x="42" y="101" fontSize="3.5" fill="#fff" fontFamily="sans-serif" opacity="0.85">SWM-CHB</text>

      {/* Front bumper */}
      <rect x="22" y="95" width="6" height="12" fill="#0a1832" />
      {/* Headlight */}
      <circle cx="28" cy="85" r="2.5" fill="#e0b766" />

      {/* Wheels */}
      <g>
        <circle cx="50" cy="108" r="11" fill="#1c1917" />
        <circle cx="50" cy="108" r="5" fill="#57534e" />
        <circle cx="50" cy="108" r="2" fill="#1c1917" />
      </g>
      <g>
        <circle cx="155" cy="108" r="11" fill="#1c1917" />
        <circle cx="155" cy="108" r="5" fill="#57534e" />
        <circle cx="155" cy="108" r="2" fill="#1c1917" />
      </g>
      <g>
        <circle cx="180" cy="108" r="11" fill="#1c1917" />
        <circle cx="180" cy="108" r="5" fill="#57534e" />
        <circle cx="180" cy="108" r="2" fill="#1c1917" />
      </g>
    </svg>
  );
}

/**
 * SanitationWorker — silhouette of a BMC sanitation worker
 * with safety vest and broom (representing field staff).
 */
export function SanitationWorker({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 200" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="worker-vest" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0b766" />
          <stop offset="100%" stopColor="#b27e2a" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="60" cy="190" rx="35" ry="3" fill="#000" opacity="0.1" />

      {/* Legs */}
      <rect x="48" y="130" width="10" height="55" fill="#143164" />
      <rect x="62" y="130" width="10" height="55" fill="#143164" />
      <rect x="46" y="180" width="14" height="6" fill="#1c1917" />
      <rect x="60" y="180" width="14" height="6" fill="#1c1917" />

      {/* Body / safety vest */}
      <path d="M 35 80 L 85 80 L 80 135 L 40 135 Z" fill="url(#worker-vest)" stroke="#5c4216" strokeWidth="1" />
      {/* Reflective stripes */}
      <rect x="38" y="100" width="44" height="3" fill="#fff" opacity="0.85" />
      <rect x="40" y="118" width="40" height="3" fill="#fff" opacity="0.85" />

      {/* BMC badge on vest */}
      <circle cx="60" cy="92" r="5" fill="#0a1832" />
      <text x="60" y="94" textAnchor="middle" fontSize="5" fill="#e0b766" fontWeight="700" fontFamily="sans-serif">BMC</text>

      {/* Arms */}
      <rect x="28" y="82" width="9" height="40" fill="#143164" rx="3" />
      <rect x="83" y="82" width="9" height="40" fill="#143164" rx="3" />

      {/* Hands */}
      <circle cx="32" cy="125" r="5" fill="#c19169" />
      <circle cx="87" cy="125" r="5" fill="#c19169" />

      {/* Head */}
      <circle cx="60" cy="55" r="16" fill="#c19169" />
      {/* Helmet */}
      <path d="M 42 50 Q 42 35 60 35 Q 78 35 78 50 L 78 55 L 42 55 Z" fill="#d29944" stroke="#5c4216" strokeWidth="1" />
      <rect x="42" y="53" width="36" height="3" fill="#5c4216" />
      {/* Helmet badge */}
      <circle cx="60" cy="44" r="3" fill="#fff" />
      <text x="60" y="46" textAnchor="middle" fontSize="3.5" fill="#0a1832" fontWeight="700" fontFamily="sans-serif">B</text>

      {/* Face */}
      <circle cx="55" cy="58" r="1" fill="#1c1917" />
      <circle cx="65" cy="58" r="1" fill="#1c1917" />
      <path d="M 56 65 Q 60 67 64 65" stroke="#1c1917" strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* Broom (right hand) */}
      <line x1="92" y1="125" x2="105" y2="50" stroke="#8a6020" strokeWidth="2" strokeLinecap="round" />
      <g transform="translate(105, 50)">
        <rect x="-6" y="-3" width="12" height="6" fill="#5c4216" />
        <line x1="-5" y1="3" x2="-7" y2="14" stroke="#a8a29e" strokeWidth="1" />
        <line x1="-2" y1="3" x2="-3" y2="15" stroke="#a8a29e" strokeWidth="1" />
        <line x1="0" y1="3" x2="0" y2="16" stroke="#a8a29e" strokeWidth="1" />
        <line x1="2" y1="3" x2="3" y2="15" stroke="#a8a29e" strokeWidth="1" />
        <line x1="5" y1="3" x2="7" y2="14" stroke="#a8a29e" strokeWidth="1" />
      </g>
    </svg>
  );
}

/**
 * RoutePin — geo-fenced route marker illustration.
 */
export function RoutePin({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 120" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="pin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a7bc1" />
          <stop offset="100%" stopColor="#143164" />
        </linearGradient>
      </defs>
      {/* Geofence circle */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="#143164" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      <circle cx="50" cy="50" r="36" fill="#143164" opacity="0.06" />
      {/* Pin body */}
      <path d="M 50 12 C 32 12 22 26 22 42 C 22 62 50 92 50 92 C 50 92 78 62 78 42 C 78 26 68 12 50 12 Z" fill="url(#pin-grad)" stroke="#0a1832" strokeWidth="1" />
      {/* Inner circle */}
      <circle cx="50" cy="40" r="11" fill="#fff" />
      <circle cx="50" cy="40" r="6" fill="#d29944" />
      {/* Ground shadow */}
      <ellipse cx="50" cy="105" rx="14" ry="3" fill="#000" opacity="0.15" />
    </svg>
  );
}

/**
 * EmptyStateIllustration — used on pages with no data.
 * Shows an empty clipboard/document.
 */
export function EmptyStateIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Clipboard back */}
      <rect x="50" y="40" width="100" height="130" rx="6" fill="#fff" stroke="#c9c2af" strokeWidth="2" />
      {/* Clip */}
      <rect x="80" y="30" width="40" height="20" rx="3" fill="#d29944" stroke="#8a6020" strokeWidth="1.5" />
      <rect x="88" y="36" width="24" height="8" rx="1.5" fill="#fff" />
      {/* Lines representing missing content */}
      <rect x="65" y="70" width="70" height="4" rx="2" fill="#e7e5e4" />
      <rect x="65" y="84" width="50" height="4" rx="2" fill="#e7e5e4" />
      <rect x="65" y="98" width="60" height="4" rx="2" fill="#e7e5e4" />
      <rect x="65" y="112" width="40" height="4" rx="2" fill="#e7e5e4" />
      <rect x="65" y="126" width="55" height="4" rx="2" fill="#e7e5e4" />
      {/* Subtle decorative dots */}
      <circle cx="170" cy="60" r="3" fill="#d29944" opacity="0.3" />
      <circle cx="35" cy="90" r="2" fill="#143164" opacity="0.3" />
      <circle cx="160" cy="150" r="2" fill="#143164" opacity="0.3" />
    </svg>
  );
}

/**
 * GeofenceMap — abstract map with route waypoints.
 */
export function GeofenceMap({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 320 240" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="map-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#c9c2af" strokeWidth="0.4" opacity="0.5" />
        </pattern>
      </defs>

      {/* Map background */}
      <rect width="320" height="240" fill="#faf9f5" />
      <rect width="320" height="240" fill="url(#map-grid)" />

      {/* Roads */}
      <path d="M 0 80 L 320 80" stroke="#d6d3d1" strokeWidth="6" />
      <path d="M 0 160 L 320 160" stroke="#d6d3d1" strokeWidth="6" />
      <path d="M 80 0 L 80 240" stroke="#d6d3d1" strokeWidth="6" />
      <path d="M 220 0 L 220 240" stroke="#d6d3d1" strokeWidth="6" />

      {/* Route path */}
      <path
        d="M 60 200 Q 80 180 80 160 L 80 140 Q 80 120 100 100 L 180 80 Q 220 80 240 60"
        stroke="#143164"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="0"
      />

      {/* Geofence at start */}
      <circle cx="60" cy="200" r="30" fill="#143164" opacity="0.08" />
      <circle cx="60" cy="200" r="30" fill="none" stroke="#143164" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />

      {/* Start pin (BMC blue) */}
      <circle cx="60" cy="200" r="8" fill="#143164" />
      <circle cx="60" cy="200" r="4" fill="#fff" />

      {/* Mid waypoints */}
      <circle cx="100" cy="100" r="5" fill="#d29944" stroke="#8a6020" strokeWidth="1" />
      <circle cx="180" cy="80" r="5" fill="#d29944" stroke="#8a6020" strokeWidth="1" />

      {/* End pin (gold) */}
      <g transform="translate(240, 60)">
        <circle r="8" fill="#15803d" />
        <circle r="4" fill="#fff" />
      </g>

      {/* Compass rose (top right) */}
      <g transform="translate(285, 35)">
        <circle r="16" fill="#fff" stroke="#c9c2af" strokeWidth="1" />
        <path d="M 0 -12 L 3 0 L 0 12 L -3 0 Z" fill="#143164" />
        <text y="-19" textAnchor="middle" fontSize="6" fill="#143164" fontWeight="700">N</text>
      </g>
    </svg>
  );
}
