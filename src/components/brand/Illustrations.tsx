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
