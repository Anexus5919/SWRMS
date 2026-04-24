type BadgeVariant = 'green' | 'amber' | 'red' | 'neutral' | 'blue' | 'gold';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  green:   { bg: 'bg-status-green-light', text: 'text-status-green-dark', dot: 'bg-status-green' },
  amber:   { bg: 'bg-status-amber-light', text: 'text-status-amber-dark', dot: 'bg-status-amber' },
  red:     { bg: 'bg-status-red-light',   text: 'text-status-red-dark',   dot: 'bg-status-red' },
  neutral: { bg: 'bg-[var(--neutral-100)]', text: 'text-[var(--neutral-700)]', dot: 'bg-[var(--neutral-500)]' },
  blue:    { bg: 'bg-bmc-50',             text: 'text-bmc-800',           dot: 'bg-bmc-600' },
  gold:    { bg: 'bg-gold-100',           text: 'text-gold-700',          dot: 'bg-gold-500' },
};

export default function Badge({ variant = 'neutral', children, className = '', dot = false }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${styles.bg} ${styles.text} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />}
      {children}
    </span>
  );
}
