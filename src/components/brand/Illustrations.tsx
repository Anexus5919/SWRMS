/**
 * Domain illustrations for SWRMS - waste collection, sanitation
 * workers, Mumbai cityscape, route maps. Hand-crafted SVG that
 * evokes the BMC operational context, not a generic SaaS product.
 */

interface IllustrationProps {
  className?: string;
  size?: number;
}

/**
 * BMCHeritageBuilding - detailed line drawing of the iconic
 * Brihanmumbai Municipal Corporation HQ as it appears from the
 * front (1893, F.W. Stevens - Indo-Saracenic Revival).
 *
 * Captures: central tower with onion dome + main spire + 2 needle
 * spires, triangular gable pediment with niche statue, clock,
 * main signboard, two flanking domed turrets, two extending wings
 * with 4 floors of pointed-arch arcades, ornamental finials,
 * Victorian lampposts, foreground "Urbs Prima in Indis" statue.
 *
 * Single-color stroked SVG - colour applied via className.
 */
export function BMCHeritageBuilding({ className = '' }: IllustrationProps) {
  return (
    <svg
      viewBox="-20 -50 840 640"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMidYEnd meet"
      aria-hidden="true"
    >
      {/* ── Ground / pavement line ──────────────────── */}
      <line x1="-20" y1="560" x2="820" y2="560" strokeWidth="1.4" />
      <line x1="-20" y1="565" x2="820" y2="565" strokeWidth="0.4" opacity="0.5" />

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── LEFT WING (4 storeys with detailed arcades) ───── */}
      {/* ═════════════════════════════════════════════════════ */}
      <g>
        {/* Outer mass envelope */}
        <line x1="60" y1="560" x2="60" y2="290" strokeWidth="1.1" />
        <line x1="60" y1="290" x2="240" y2="290" strokeWidth="1.1" />

        {/* Decorative cornice band at top of wing */}
        <line x1="60" y1="282" x2="240" y2="282" strokeWidth="0.6" />
        <line x1="60" y1="278" x2="240" y2="278" strokeWidth="0.4" />
        {/* Crenellation row */}
        <g strokeWidth="0.6">
          {Array.from({ length: 11 }).map((_, i) => {
            const x = 62 + i * 16;
            return <path key={`lc-${i}`} d={`M ${x} 278 L ${x} 272 L ${x + 8} 272 L ${x + 8} 278`} />;
          })}
        </g>

        {/* Wing roofline finials (small spires) */}
        <g strokeWidth="0.6">
          {[68, 110, 150, 190, 230].map((x, i) => (
            <g key={`lf-${i}`}>
              <line x1={x} y1="272" x2={x} y2="262" />
              <circle cx={x} cy="260" r="1.2" />
              <line x1={x} y1="258" x2={x} y2="252" />
            </g>
          ))}
        </g>

        {/* Floor 4 (top) - small paired round windows */}
        <g strokeWidth="0.7">
          {[80, 120, 160, 200].map((x, i) => (
            <g key={`l4-${i}`}>
              <circle cx={x} cy="305" r="5" />
              <circle cx={x + 10} cy="305" r="5" />
              <line x1={x - 2} y1="305" x2={x + 2} y2="305" strokeWidth="0.4" />
              <line x1={x + 8} y1="305" x2={x + 12} y2="305" strokeWidth="0.4" />
            </g>
          ))}
          {/* Floor divider */}
          <line x1="60" y1="320" x2="240" y2="320" strokeWidth="0.5" />
        </g>

        {/* Floor 3 - pointed arch windows in groups */}
        <g strokeWidth="0.7">
          {[68, 100, 132, 164, 196, 228].map((x, i) => (
            <g key={`l3-${i}`}>
              {/* Pointed gothic arch */}
              <path d={`M ${x} 360 L ${x} 340 Q ${x} 332 ${x + 6} 330 Q ${x + 12} 332 ${x + 12} 340 L ${x + 12} 360 Z`} />
              {/* Mullion */}
              <line x1={x + 6} y1="338" x2={x + 6} y2="360" strokeWidth="0.4" />
              {/* Sill */}
              <line x1={x - 1} y1="360" x2={x + 13} y2="360" strokeWidth="0.4" />
            </g>
          ))}
          <line x1="60" y1="370" x2="240" y2="370" strokeWidth="0.5" />
        </g>

        {/* Floor 2 - taller paired arched windows */}
        <g strokeWidth="0.7">
          {[68, 100, 132, 164, 196, 228].map((x, i) => (
            <g key={`l2-${i}`}>
              <path d={`M ${x} 425 L ${x} 395 Q ${x} 385 ${x + 6} 383 Q ${x + 12} 385 ${x + 12} 395 L ${x + 12} 425 Z`} />
              <line x1={x + 6} y1="392" x2={x + 6} y2="425" strokeWidth="0.4" />
              {/* Horizontal transom */}
              <line x1={x + 1} y1="408" x2={x + 11} y2="408" strokeWidth="0.4" />
              {/* Decorative balustrade below */}
              <path d={`M ${x - 1} 425 L ${x + 13} 425`} />
              <line x1={x - 1} y1="430" x2={x + 13} y2="430" strokeWidth="0.4" />
            </g>
          ))}
          <line x1="60" y1="440" x2="240" y2="440" strokeWidth="0.5" />
        </g>

        {/* Floor 1 (ground) - open colonnade arches */}
        <g strokeWidth="0.8">
          {[68, 105, 142, 179, 216].map((x, i) => (
            <g key={`l1-${i}`}>
              {/* Arched opening */}
              <path d={`M ${x} 555 L ${x} 480 Q ${x} 466 ${x + 14} 465 Q ${x + 28} 466 ${x + 28} 480 L ${x + 28} 555`} />
              {/* Springing line */}
              <line x1={x - 1} y1="480" x2={x + 29} y2="480" strokeWidth="0.4" />
              {/* Capital decoration */}
              <circle cx={x} cy="478" r="1" strokeWidth="0.5" />
              <circle cx={x + 28} cy="478" r="1" strokeWidth="0.5" />
            </g>
          ))}
        </g>

        {/* Wing-to-tower joint (pillar) */}
        <line x1="240" y1="290" x2="240" y2="560" strokeWidth="1" />
      </g>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── LEFT FLANKING TURRET ──────────────────────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <g>
        {/* Turret body */}
        <line x1="248" y1="560" x2="248" y2="240" strokeWidth="1" />
        <line x1="298" y1="560" x2="298" y2="240" strokeWidth="1" />
        <line x1="248" y1="240" x2="298" y2="240" strokeWidth="0.7" />

        {/* Decorative cornice */}
        <line x1="244" y1="234" x2="302" y2="234" strokeWidth="0.5" />
        <line x1="244" y1="230" x2="302" y2="230" strokeWidth="0.4" />

        {/* Octagonal drum */}
        <path d="M 248 230 L 254 218 L 292 218 L 298 230" strokeWidth="0.7" />
        <line x1="252" y1="222" x2="294" y2="222" strokeWidth="0.4" />

        {/* Drum windows */}
        <g strokeWidth="0.5">
          <path d="M 258 230 L 258 224 Q 258 220 261 220 Q 264 220 264 224 L 264 230 Z" />
          <path d="M 270 230 L 270 224 Q 270 220 273 220 Q 276 220 276 224 L 276 230 Z" />
          <path d="M 282 230 L 282 224 Q 282 220 285 220 Q 288 220 288 224 L 288 230 Z" />
        </g>

        {/* Onion dome */}
        <path d="M 248 218 Q 246 200 252 188 Q 258 178 273 175 Q 288 178 294 188 Q 300 200 298 218" strokeWidth="1.1" />
        {/* Dome vertical ribs */}
        <line x1="258" y1="180" x2="258" y2="218" strokeWidth="0.4" />
        <line x1="265" y1="177" x2="265" y2="218" strokeWidth="0.4" />
        <line x1="273" y1="175" x2="273" y2="218" strokeWidth="0.5" />
        <line x1="281" y1="177" x2="281" y2="218" strokeWidth="0.4" />
        <line x1="288" y1="180" x2="288" y2="218" strokeWidth="0.4" />

        {/* Dome neck + spire */}
        <ellipse cx="273" cy="172" rx="6" ry="2" strokeWidth="0.5" />
        <line x1="273" y1="170" x2="273" y2="158" strokeWidth="0.9" />
        <circle cx="273" cy="158" r="3" strokeWidth="0.7" />
        <line x1="273" y1="155" x2="273" y2="148" strokeWidth="0.6" />
        <circle cx="273" cy="148" r="1.6" strokeWidth="0.5" />
        <line x1="273" y1="146" x2="273" y2="140" strokeWidth="0.4" />

        {/* Turret windows (3 floors) */}
        <g strokeWidth="0.6">
          {/* Top single arched window */}
          <path d="M 263 290 L 263 268 Q 263 260 273 258 Q 283 260 283 268 L 283 290 Z" />
          <line x1="273" y1="266" x2="273" y2="290" strokeWidth="0.4" />
          {/* Mid window */}
          <path d="M 263 350 L 263 320 Q 263 312 273 310 Q 283 312 283 320 L 283 350 Z" />
          <line x1="273" y1="318" x2="273" y2="350" strokeWidth="0.4" />
          <line x1="263" y1="335" x2="283" y2="335" strokeWidth="0.4" />
          {/* Lower window */}
          <path d="M 258 425 L 258 385 Q 258 375 273 372 Q 288 375 288 385 L 288 425" />
          <line x1="273" y1="383" x2="273" y2="425" strokeWidth="0.4" />
          <line x1="258" y1="408" x2="288" y2="408" strokeWidth="0.4" />
        </g>

        {/* Turret base entrance */}
        <path d="M 256 555 L 256 470 Q 256 458 273 456 Q 290 458 290 470 L 290 555" strokeWidth="0.8" />
        <line x1="255" y1="470" x2="291" y2="470" strokeWidth="0.4" />

        {/* Floor dividers */}
        <line x1="248" y1="305" x2="298" y2="305" strokeWidth="0.4" />
        <line x1="248" y1="365" x2="298" y2="365" strokeWidth="0.4" />
        <line x1="248" y1="445" x2="298" y2="445" strokeWidth="0.4" />
      </g>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── CENTRAL TOWER - the iconic dome + clock + statue ─ */}
      {/* ═════════════════════════════════════════════════════ */}
      <g>
        {/* MAIN SPIRE on top of dome */}
        <line x1="400" y1="-30" x2="400" y2="0" strokeWidth="1.2" />
        <path d="M 397 -25 L 400 -30 L 403 -25" strokeWidth="0.6" />
        <line x1="400" y1="0" x2="400" y2="35" strokeWidth="1.5" />
        <circle cx="400" cy="14" r="3.5" strokeWidth="0.8" />
        <line x1="396.5" y1="14" x2="403.5" y2="14" strokeWidth="0.4" />
        <line x1="400" y1="35" x2="400" y2="60" strokeWidth="1.2" />
        <circle cx="400" cy="48" r="2" strokeWidth="0.6" />

        {/* Two NEEDLE SPIRES flanking the main spire */}
        <g strokeWidth="0.6">
          <line x1="372" y1="60" x2="372" y2="20" />
          <circle cx="372" cy="22" r="1.4" />
          <line x1="372" y1="20" x2="372" y2="12" strokeWidth="0.4" />
          <path d="M 370 14 L 372 12 L 374 14" strokeWidth="0.4" />

          <line x1="428" y1="60" x2="428" y2="20" />
          <circle cx="428" cy="22" r="1.4" />
          <line x1="428" y1="20" x2="428" y2="12" strokeWidth="0.4" />
          <path d="M 426 14 L 428 12 L 430 14" strokeWidth="0.4" />
        </g>

        {/* MAIN ONION DOME */}
        <path d="M 360 130 Q 354 95 372 70 Q 386 56 400 56 Q 414 56 428 70 Q 446 95 440 130" strokeWidth="1.4" />
        {/* Dome vertical ribs */}
        <g strokeWidth="0.5">
          <line x1="368" y1="78" x2="368" y2="130" />
          <line x1="378" y1="68" x2="378" y2="130" />
          <line x1="388" y1="60" x2="388" y2="130" />
          <line x1="400" y1="56" x2="400" y2="130" strokeWidth="0.7" />
          <line x1="412" y1="60" x2="412" y2="130" />
          <line x1="422" y1="68" x2="422" y2="130" />
          <line x1="432" y1="78" x2="432" y2="130" />
        </g>
        {/* Dome horizontal bands */}
        <path d="M 357 95 Q 400 88 443 95" strokeWidth="0.4" />
        <path d="M 359 110 Q 400 105 441 110" strokeWidth="0.4" />

        {/* Dome neck / lotus pad */}
        <ellipse cx="400" cy="55" rx="15" ry="3.5" strokeWidth="0.6" />
        <ellipse cx="400" cy="52" rx="11" ry="2.5" strokeWidth="0.5" />

        {/* Drum below dome (octagonal) */}
        <path d="M 358 130 L 442 130" strokeWidth="0.9" />
        <path d="M 358 130 L 358 148 L 442 148 L 442 130" strokeWidth="0.8" />
        {/* Drum windows */}
        <g strokeWidth="0.5">
          {[366, 380, 394, 408, 422, 436].map((x, i) => (
            <path key={`drum-${i}`} d={`M ${x - 2} 146 L ${x - 2} 138 Q ${x - 2} 134 ${x} 134 Q ${x + 2} 134 ${x + 2} 138 L ${x + 2} 146 Z`} />
          ))}
          <line x1="358" y1="148" x2="442" y2="148" strokeWidth="0.4" />
          <line x1="358" y1="151" x2="442" y2="151" strokeWidth="0.3" />
        </g>

        {/* CLOCK SECTION (square base under drum) */}
        <line x1="350" y1="155" x2="350" y2="220" strokeWidth="1" />
        <line x1="450" y1="155" x2="450" y2="220" strokeWidth="1" />
        <line x1="350" y1="155" x2="450" y2="155" strokeWidth="0.8" />
        {/* Clock face */}
        <circle cx="400" cy="185" r="18" strokeWidth="1" />
        <circle cx="400" cy="185" r="14" strokeWidth="0.4" />
        {/* Clock hands */}
        <line x1="400" y1="185" x2="400" y2="174" strokeWidth="0.9" />
        <line x1="400" y1="185" x2="408" y2="190" strokeWidth="0.9" />
        <circle cx="400" cy="185" r="1.4" fill="currentColor" stroke="none" />
        {/* Clock numerals (tick marks at 12,3,6,9 and minor ticks).
            Coordinates rounded to keep SSR + client output identical. */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const inner = i % 3 === 0 ? 14 : 16;
          const x1 = (400 + Math.cos(rad) * inner).toFixed(2);
          const y1 = (185 + Math.sin(rad) * inner).toFixed(2);
          const x2 = (400 + Math.cos(rad) * 18).toFixed(2);
          const y2 = (185 + Math.sin(rad) * 18).toFixed(2);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i % 3 === 0 ? 0.7 : 0.4} />;
        })}
        {/* Clock face decorative crown */}
        <path d="M 392 167 Q 400 162 408 167" strokeWidth="0.4" />
        {/* Side niches with windows */}
        <g strokeWidth="0.5">
          <path d="M 358 200 L 358 168 Q 358 162 364 162 Q 370 162 370 168 L 370 200 Z" />
          <line x1="364" y1="166" x2="364" y2="200" strokeWidth="0.3" />
          <path d="M 430 200 L 430 168 Q 430 162 436 162 Q 442 162 442 168 L 442 200 Z" />
          <line x1="436" y1="166" x2="436" y2="200" strokeWidth="0.3" />
        </g>

        {/* TOWER UPPER BODY (3 tall arched windows) */}
        <line x1="346" y1="220" x2="346" y2="298" strokeWidth="1" />
        <line x1="454" y1="220" x2="454" y2="298" strokeWidth="1" />
        <line x1="346" y1="220" x2="454" y2="220" strokeWidth="0.8" />
        {/* Inset cornice */}
        <line x1="348" y1="225" x2="452" y2="225" strokeWidth="0.4" />
        {/* Three tall windows */}
        <g strokeWidth="0.6">
          <path d="M 358 295 L 358 245 Q 358 234 372 232 Q 386 234 386 245 L 386 295 Z" />
          <line x1="372" y1="240" x2="372" y2="295" strokeWidth="0.4" />
          <line x1="358" y1="270" x2="386" y2="270" strokeWidth="0.4" />

          <path d="M 386 295 L 386 245 Q 386 234 400 232 Q 414 234 414 245 L 414 295 Z" />
          <line x1="400" y1="240" x2="400" y2="295" strokeWidth="0.4" />
          <line x1="386" y1="270" x2="414" y2="270" strokeWidth="0.4" />

          <path d="M 414 295 L 414 245 Q 414 234 428 232 Q 442 234 442 245 L 442 295 Z" />
          <line x1="428" y1="240" x2="428" y2="295" strokeWidth="0.4" />
          <line x1="414" y1="270" x2="442" y2="270" strokeWidth="0.4" />
        </g>

        {/* Tower base cornice */}
        <line x1="334" y1="298" x2="466" y2="298" strokeWidth="0.7" />
        <line x1="334" y1="302" x2="466" y2="302" strokeWidth="0.5" />

        {/* TRIANGULAR PEDIMENT GABLE (the big triangular peak) */}
        <path d="M 320 305 L 400 240 L 480 305" strokeWidth="1.1" />
        <path d="M 326 305 L 400 246 L 474 305" strokeWidth="0.4" />
        {/* Pediment ornaments */}
        <circle cx="400" cy="245" r="2" strokeWidth="0.7" />
        <line x1="400" y1="243" x2="400" y2="234" strokeWidth="0.6" />
        <circle cx="400" cy="232" r="1.4" strokeWidth="0.5" />
        {/* Pediment rake finials */}
        <g strokeWidth="0.5">
          <line x1="320" y1="305" x2="320" y2="298" />
          <circle cx="320" cy="296" r="1.2" />
          <line x1="480" y1="305" x2="480" y2="298" />
          <circle cx="480" cy="296" r="1.2" />
        </g>

        {/* Niche with statue inside pediment */}
        <path d="M 388 305 L 388 280 Q 388 270 400 268 Q 412 270 412 280 L 412 305 Z" strokeWidth="0.6" />
        {/* The statue (small figure) */}
        <g transform="translate(400, 290)" strokeWidth="0.5">
          <ellipse cx="0" cy="-7" rx="2" ry="2.5" />
          <line x1="0" y1="-4.5" x2="0" y2="6" strokeWidth="0.8" />
          <line x1="0" y1="-2" x2="-3" y2="2" strokeWidth="0.4" />
          <line x1="0" y1="-2" x2="3" y2="2" strokeWidth="0.4" />
          <line x1="-1.5" y1="6" x2="-1.5" y2="13" />
          <line x1="1.5" y1="6" x2="1.5" y2="13" />
          {/* Pedestal */}
          <rect x="-3" y="13" width="6" height="2" />
        </g>

        {/* SIGN BAND (नगरपालिका मुख्यालय) */}
        <rect x="332" y="310" width="136" height="14" strokeWidth="0.7" />
        <line x1="332" y1="324" x2="468" y2="324" strokeWidth="0.4" />
        {/* Faux text suggestion (small dashes) */}
        <g strokeWidth="0.5">
          {[345, 360, 380, 400, 420, 440, 458].map((x, i) => (
            <line key={`sign-${i}`} x1={x} y1="318" x2={x + 8} y2="318" />
          ))}
        </g>

        {/* MAIN FACADE upper floor (round windows) */}
        <line x1="320" y1="324" x2="320" y2="560" strokeWidth="1.1" />
        <line x1="480" y1="324" x2="480" y2="560" strokeWidth="1.1" />
        <line x1="320" y1="380" x2="480" y2="380" strokeWidth="0.5" />
        <g strokeWidth="0.6">
          {[342, 376, 410, 444].map((x, i) => (
            <g key={`r-${i}`}>
              <circle cx={x} cy="354" r="9" />
              <circle cx={x} cy="354" r="6" strokeWidth="0.4" />
              {/* Window mullion cross */}
              <line x1={x - 8} y1="354" x2={x + 8} y2="354" strokeWidth="0.3" />
              <line x1={x} y1="346" x2={x} y2="362" strokeWidth="0.3" />
            </g>
          ))}
        </g>

        {/* MAIN FACADE middle floor (paired arched windows) */}
        <g strokeWidth="0.6">
          {[332, 372, 412, 452].map((x, i) => (
            <g key={`m-${i}`}>
              <path d={`M ${x} 460 L ${x} 405 Q ${x} 392 ${x + 8} 390 Q ${x + 16} 392 ${x + 16} 405 L ${x + 16} 460 Z`} />
              <line x1={x + 8} y1="395" x2={x + 8} y2="460" strokeWidth="0.4" />
              <line x1={x + 1} y1="425" x2={x + 15} y2="425" strokeWidth="0.4" />
              <line x1={x + 1} y1="445" x2={x + 15} y2="445" strokeWidth="0.4" />
              {/* Balcony rail below */}
              <line x1={x - 2} y1="463" x2={x + 18} y2="463" strokeWidth="0.4" />
            </g>
          ))}
          <line x1="320" y1="470" x2="480" y2="470" strokeWidth="0.5" />
        </g>

        {/* MAIN ENTRANCE - large central archway */}
        <g strokeWidth="0.9">
          <path d="M 350 555 L 350 510 Q 350 488 400 484 Q 450 488 450 510 L 450 555" />
          <line x1="349" y1="510" x2="451" y2="510" strokeWidth="0.5" />
          {/* Inner door rim */}
          <path d="M 360 555 L 360 515 Q 360 498 400 495 Q 440 498 440 515 L 440 555" strokeWidth="0.5" />
          {/* Voussoir details around arch - rounded to avoid SSR mismatch */}
          {[350, 360, 376, 400, 424, 440, 450].map((x, i) => {
            const angle = ((x - 400) / 50) * 0.9;
            const top = (484 + Math.abs(angle) * 8).toFixed(2);
            const x2 = (x + Math.sin(angle) * 4).toFixed(2);
            const y2 = (parseFloat(top) - 4).toFixed(2);
            return <line key={`v-${i}`} x1={x} y1="490" x2={x2} y2={y2} strokeWidth="0.3" />;
          })}
          {/* Side narrow doors */}
          <path d="M 326 555 L 326 525 Q 326 515 336 514 Q 346 515 346 525 L 346 555" strokeWidth="0.6" />
          <path d="M 454 555 L 454 525 Q 454 515 464 514 Q 474 515 474 525 L 474 555" strokeWidth="0.6" />
        </g>

        {/* Entrance steps */}
        <line x1="335" y1="557" x2="465" y2="557" strokeWidth="0.5" />
        <line x1="340" y1="560" x2="460" y2="560" strokeWidth="0.5" />
      </g>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── RIGHT FLANKING TURRET (mirror of left) ────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <g>
        <line x1="502" y1="560" x2="502" y2="240" strokeWidth="1" />
        <line x1="552" y1="560" x2="552" y2="240" strokeWidth="1" />
        <line x1="502" y1="240" x2="552" y2="240" strokeWidth="0.7" />
        <line x1="498" y1="234" x2="556" y2="234" strokeWidth="0.5" />
        <line x1="498" y1="230" x2="556" y2="230" strokeWidth="0.4" />
        <path d="M 502 230 L 508 218 L 546 218 L 552 230" strokeWidth="0.7" />
        <line x1="506" y1="222" x2="548" y2="222" strokeWidth="0.4" />
        <g strokeWidth="0.5">
          <path d="M 512 230 L 512 224 Q 512 220 515 220 Q 518 220 518 224 L 518 230 Z" />
          <path d="M 524 230 L 524 224 Q 524 220 527 220 Q 530 220 530 224 L 530 230 Z" />
          <path d="M 536 230 L 536 224 Q 536 220 539 220 Q 542 220 542 224 L 542 230 Z" />
        </g>
        <path d="M 502 218 Q 500 200 506 188 Q 512 178 527 175 Q 542 178 548 188 Q 554 200 552 218" strokeWidth="1.1" />
        <g strokeWidth="0.5">
          <line x1="512" y1="180" x2="512" y2="218" />
          <line x1="519" y1="177" x2="519" y2="218" />
          <line x1="527" y1="175" x2="527" y2="218" strokeWidth="0.5" />
          <line x1="535" y1="177" x2="535" y2="218" />
          <line x1="542" y1="180" x2="542" y2="218" />
        </g>
        <ellipse cx="527" cy="172" rx="6" ry="2" strokeWidth="0.5" />
        <line x1="527" y1="170" x2="527" y2="158" strokeWidth="0.9" />
        <circle cx="527" cy="158" r="3" strokeWidth="0.7" />
        <line x1="527" y1="155" x2="527" y2="148" strokeWidth="0.6" />
        <circle cx="527" cy="148" r="1.6" strokeWidth="0.5" />
        <line x1="527" y1="146" x2="527" y2="140" strokeWidth="0.4" />
        <g strokeWidth="0.6">
          <path d="M 517 290 L 517 268 Q 517 260 527 258 Q 537 260 537 268 L 537 290 Z" />
          <line x1="527" y1="266" x2="527" y2="290" strokeWidth="0.4" />
          <path d="M 517 350 L 517 320 Q 517 312 527 310 Q 537 312 537 320 L 537 350 Z" />
          <line x1="527" y1="318" x2="527" y2="350" strokeWidth="0.4" />
          <line x1="517" y1="335" x2="537" y2="335" strokeWidth="0.4" />
          <path d="M 512 425 L 512 385 Q 512 375 527 372 Q 542 375 542 385 L 542 425" />
          <line x1="527" y1="383" x2="527" y2="425" strokeWidth="0.4" />
          <line x1="512" y1="408" x2="542" y2="408" strokeWidth="0.4" />
        </g>
        <path d="M 510 555 L 510 470 Q 510 458 527 456 Q 544 458 544 470 L 544 555" strokeWidth="0.8" />
        <line x1="509" y1="470" x2="545" y2="470" strokeWidth="0.4" />
        <line x1="502" y1="305" x2="552" y2="305" strokeWidth="0.4" />
        <line x1="502" y1="365" x2="552" y2="365" strokeWidth="0.4" />
        <line x1="502" y1="445" x2="552" y2="445" strokeWidth="0.4" />
      </g>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── RIGHT WING (mirror of left) ──────────────────── */}
      {/* ═════════════════════════════════════════════════════ */}
      <g>
        <line x1="740" y1="560" x2="740" y2="290" strokeWidth="1.1" />
        <line x1="560" y1="290" x2="740" y2="290" strokeWidth="1.1" />
        <line x1="560" y1="282" x2="740" y2="282" strokeWidth="0.6" />
        <line x1="560" y1="278" x2="740" y2="278" strokeWidth="0.4" />
        <g strokeWidth="0.6">
          {Array.from({ length: 11 }).map((_, i) => {
            const x = 562 + i * 16;
            return <path key={`rc-${i}`} d={`M ${x} 278 L ${x} 272 L ${x + 8} 272 L ${x + 8} 278`} />;
          })}
        </g>
        <g strokeWidth="0.6">
          {[572, 612, 652, 692, 732].map((x, i) => (
            <g key={`rf-${i}`}>
              <line x1={x} y1="272" x2={x} y2="262" />
              <circle cx={x} cy="260" r="1.2" />
              <line x1={x} y1="258" x2={x} y2="252" />
            </g>
          ))}
        </g>
        <g strokeWidth="0.7">
          {[580, 620, 660, 700].map((x, i) => (
            <g key={`r4-${i}`}>
              <circle cx={x} cy="305" r="5" />
              <circle cx={x + 10} cy="305" r="5" />
              <line x1={x - 2} y1="305" x2={x + 2} y2="305" strokeWidth="0.4" />
              <line x1={x + 8} y1="305" x2={x + 12} y2="305" strokeWidth="0.4" />
            </g>
          ))}
          <line x1="560" y1="320" x2="740" y2="320" strokeWidth="0.5" />
        </g>
        <g strokeWidth="0.7">
          {[572, 604, 636, 668, 700, 732].map((x, i) => (
            <g key={`r3-${i}`}>
              <path d={`M ${x} 360 L ${x} 340 Q ${x} 332 ${x + 6} 330 Q ${x + 12} 332 ${x + 12} 340 L ${x + 12} 360 Z`} />
              <line x1={x + 6} y1="338" x2={x + 6} y2="360" strokeWidth="0.4" />
              <line x1={x - 1} y1="360" x2={x + 13} y2="360" strokeWidth="0.4" />
            </g>
          ))}
          <line x1="560" y1="370" x2="740" y2="370" strokeWidth="0.5" />
        </g>
        <g strokeWidth="0.7">
          {[572, 604, 636, 668, 700, 732].map((x, i) => (
            <g key={`r2-${i}`}>
              <path d={`M ${x} 425 L ${x} 395 Q ${x} 385 ${x + 6} 383 Q ${x + 12} 385 ${x + 12} 395 L ${x + 12} 425 Z`} />
              <line x1={x + 6} y1="392" x2={x + 6} y2="425" strokeWidth="0.4" />
              <line x1={x + 1} y1="408" x2={x + 11} y2="408" strokeWidth="0.4" />
              <path d={`M ${x - 1} 425 L ${x + 13} 425`} />
              <line x1={x - 1} y1="430" x2={x + 13} y2="430" strokeWidth="0.4" />
            </g>
          ))}
          <line x1="560" y1="440" x2="740" y2="440" strokeWidth="0.5" />
        </g>
        <g strokeWidth="0.8">
          {[572, 609, 646, 683, 720].map((x, i) => (
            <g key={`r1-${i}`}>
              <path d={`M ${x} 555 L ${x} 480 Q ${x} 466 ${x + 14} 465 Q ${x + 28} 466 ${x + 28} 480 L ${x + 28} 555`} />
              <line x1={x - 1} y1="480" x2={x + 29} y2="480" strokeWidth="0.4" />
              <circle cx={x} cy="478" r="1" strokeWidth="0.5" />
              <circle cx={x + 28} cy="478" r="1" strokeWidth="0.5" />
            </g>
          ))}
        </g>
        <line x1="560" y1="290" x2="560" y2="560" strokeWidth="1" />
      </g>

      {/* ═════════════════════════════════════════════════════ */}
      {/* ── FOREGROUND: Victorian lampposts + statue ─────── */}
      {/* ═════════════════════════════════════════════════════ */}

      {/* Left lamppost */}
      <g strokeWidth="0.7">
        <line x1="20" y1="560" x2="20" y2="450" strokeWidth="1" />
        {/* Base */}
        <rect x="16" y="558" width="8" height="2" />
        <rect x="14" y="555" width="12" height="3" />
        {/* Brackets */}
        <path d="M 12 470 Q 16 466 20 470" />
        <path d="M 28 470 Q 24 466 20 470" />
        {/* Lamp head */}
        <line x1="14" y1="450" x2="26" y2="450" />
        <path d="M 14 450 L 12 444 L 28 444 L 26 450 Z" />
        <line x1="20" y1="444" x2="20" y2="438" />
        <path d="M 17 440 L 20 437 L 23 440" strokeWidth="0.5" />
        {/* Lamp glass detail */}
        <line x1="16" y1="447" x2="24" y2="447" strokeWidth="0.4" />
      </g>

      {/* Right lamppost */}
      <g strokeWidth="0.7">
        <line x1="780" y1="560" x2="780" y2="450" strokeWidth="1" />
        <rect x="776" y="558" width="8" height="2" />
        <rect x="774" y="555" width="12" height="3" />
        <path d="M 772 470 Q 776 466 780 470" />
        <path d="M 788 470 Q 784 466 780 470" />
        <line x1="774" y1="450" x2="786" y2="450" />
        <path d="M 774 450 L 772 444 L 788 444 L 786 450 Z" />
        <line x1="780" y1="444" x2="780" y2="438" />
        <path d="M 777 440 L 780 437 L 783 440" strokeWidth="0.5" />
        <line x1="776" y1="447" x2="784" y2="447" strokeWidth="0.4" />
      </g>

      {/* Center foreground statue (Pherozeshah Mehta) */}
      <g strokeWidth="0.6">
        {/* Pedestal */}
        <rect x="392" y="540" width="16" height="20" />
        <line x1="390" y1="540" x2="410" y2="540" strokeWidth="0.5" />
        <line x1="388" y1="560" x2="412" y2="560" strokeWidth="0.5" />
        {/* Statue figure on top of pedestal */}
        <ellipse cx="400" cy="528" rx="3" ry="3.5" strokeWidth="0.5" />
        <line x1="400" y1="531" x2="400" y2="540" strokeWidth="0.7" />
        <line x1="400" y1="534" x2="396" y2="538" strokeWidth="0.4" />
        <line x1="400" y1="534" x2="404" y2="538" strokeWidth="0.4" />
      </g>

      {/* Faint trees / foliage suggestion on either side */}
      <g strokeWidth="0.5" opacity="0.6">
        {/* Left tree */}
        <path d="M 50 560 L 50 510" />
        <ellipse cx="50" cy="500" rx="14" ry="20" strokeWidth="0.4" />
        <path d="M 38 495 Q 42 488 50 487 Q 58 488 62 495" strokeWidth="0.3" />
        <path d="M 40 505 Q 45 500 50 502 Q 55 500 60 505" strokeWidth="0.3" />

        {/* Right tree */}
        <path d="M 750 560 L 750 510" />
        <ellipse cx="750" cy="500" rx="14" ry="20" strokeWidth="0.4" />
        <path d="M 738 495 Q 742 488 750 487 Q 758 488 762 495" strokeWidth="0.3" />
        <path d="M 740 505 Q 745 500 750 502 Q 755 500 760 505" strokeWidth="0.3" />
      </g>
    </svg>
  );
}

/**
 * MumbaiSkyline - stylized line illustration of Mumbai's
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

      {/* BMC HQ - Indo-Saracenic style central building */}
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
 * WasteCollectionTruck - line-drawn illustration of a BMC waste collection vehicle.
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
 * SanitationWorker - silhouette of a BMC sanitation worker
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
 * RoutePin - geo-fenced route marker illustration.
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
 * EmptyStateIllustration - used on pages with no data.
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
 * GeofenceMap - abstract map with route waypoints.
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
