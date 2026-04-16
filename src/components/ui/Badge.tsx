type BadgeVariant = 'green' | 'amber' | 'red' | 'neutral' | 'blue';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: 'text-status-green bg-status-green-light',
  amber: 'text-status-amber bg-status-amber-light',
  red: 'text-status-red bg-status-red-light',
  neutral: 'text-[var(--neutral-600)] bg-[var(--neutral-100)]',
  blue: 'text-bmc-700 bg-bmc-50',
};

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
