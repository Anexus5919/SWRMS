interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Color of left border accent: green, amber, red, blue, gold, or none */
  statusBorder?: 'green' | 'amber' | 'red' | 'blue' | 'gold' | null;
  /** Padding preset */
  padded?: boolean;
  /** Hoverable lift effect */
  hoverable?: boolean;
}

const borderColors = {
  green: 'border-l-4 border-l-status-green',
  amber: 'border-l-4 border-l-status-amber',
  red: 'border-l-4 border-l-status-red',
  blue: 'border-l-4 border-l-bmc-600',
  gold: 'border-l-4 border-l-gold-500',
};

export default function Card({
  children,
  className = '',
  statusBorder = null,
  padded = false,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`
        bg-white border border-[var(--border)] rounded-lg shadow-doc
        ${statusBorder ? borderColors[statusBorder] : ''}
        ${padded ? 'p-5 sm:p-6' : ''}
        ${hoverable ? 'hover:shadow-doc-md transition-shadow' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
