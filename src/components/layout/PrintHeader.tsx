import BMCSeal from '@/components/brand/BMCSeal';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  reportDate?: string;
  reportType?: string;
}

/**
 * PrintHeader — official BMC letterhead for printable reports.
 * Only visible when printing (uses .print-only utility).
 * Displays seal, government identifiers, report metadata.
 */
export default function PrintHeader({ title, subtitle, reportDate, reportType }: PrintHeaderProps) {
  const generatedAt = new Date().toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="print-only mb-8">
      {/* Letterhead */}
      <div className="flex items-start gap-4 pb-4 border-b-2 border-double border-bmc-900">
        <BMCSeal size={64} variant="full" />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-bmc-700 font-bold">
            Government of Maharashtra
          </p>
          <h1 className="text-lg font-bold text-bmc-900 mt-1 font-display">
            Brihanmumbai Municipal Corporation
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Solid Waste Management Department · Chembur (M-East) Ward Office
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            19B, 20A, Rd No. 1, Chembur Gaothan, Mumbai 400 071
          </p>
        </div>
        <div className="text-right text-[10px] text-[var(--text-muted)]">
          {reportType && (
            <p className="text-[9px] uppercase tracking-wider font-bold text-bmc-700">
              {reportType}
            </p>
          )}
          {reportDate && <p className="mt-1">For: {reportDate}</p>}
          <p className="mt-1">Generated: {generatedAt}</p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-6">
        <h2 className="text-2xl font-bold text-bmc-900 font-display">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
