interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Color of left border accent: green, amber, red, or none */
  statusBorder?: 'green' | 'amber' | 'red' | null;
}

const borderColors = {
  green: 'border-l-4 border-l-status-green',
  amber: 'border-l-4 border-l-status-amber',
  red: 'border-l-4 border-l-status-red',
};

export default function Card({ children, className = '', statusBorder = null }: CardProps) {
  return (
    <div
      className={`
        bg-white border border-[var(--border)] rounded-lg
        ${statusBorder ? borderColors[statusBorder] : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
