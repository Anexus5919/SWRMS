import BMCSeal from './BMCSeal';

interface WordMarkProps {
  variant?: 'horizontal' | 'stacked' | 'compact';
  theme?: 'light' | 'dark';
  showTagline?: boolean;
  className?: string;
}

/**
 * BMC SWRMS official wordmark — combines the seal with
 * the program identity. Used in headers and official documents.
 */
export default function WordMark({
  variant = 'horizontal',
  theme = 'dark',
  showTagline = true,
  className = '',
}: WordMarkProps) {
  const isLight = theme === 'light';
  const primaryColor = isLight ? 'text-bmc-900' : 'text-white';
  const secondaryColor = isLight ? 'text-neutral-600' : 'text-white/70';
  const accentColor = isLight ? 'text-gold-700' : 'text-gold-300';

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <BMCSeal size={36} variant="minimal" />
        <div className="leading-tight">
          <p className={`font-display text-sm font-bold tracking-tight ${primaryColor}`}>
            SWRMS
          </p>
          <p className={`text-[10px] uppercase tracking-wider ${secondaryColor}`}>
            BMC · SWM
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <BMCSeal size={88} variant="full" />
        <div className="mt-3">
          <p className={`text-[10px] uppercase tracking-[0.18em] font-semibold ${accentColor} mb-1`}>
            Government of Maharashtra
          </p>
          <h1 className={`font-display text-base font-bold tracking-tight ${primaryColor}`}>
            Brihanmumbai Municipal Corporation
          </h1>
          <p className={`text-xs ${secondaryColor} font-medium mt-0.5`}>
            Solid Waste Management Department
          </p>
          {showTagline && (
            <>
              <div className="w-12 h-px bg-gold-500 mx-auto my-3" />
              <p className={`font-display text-2xl font-bold tracking-tight ${primaryColor}`}>
                SWRMS
              </p>
              <p className={`text-[11px] ${secondaryColor} mt-0.5`}>
                Smart Workforce &amp; Route Management System
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BMCSeal size={48} variant="full" />
      <div className="leading-tight">
        <p className={`text-[9px] uppercase tracking-[0.18em] font-semibold ${accentColor}`}>
          Government of Maharashtra
        </p>
        <h1 className={`font-display text-sm font-bold tracking-tight ${primaryColor} mt-0.5`}>
          Brihanmumbai Municipal Corporation
        </h1>
        <p className={`text-[11px] ${secondaryColor} mt-0.5`}>
          Solid Waste Management · Chembur Ward
        </p>
      </div>
    </div>
  );
}
