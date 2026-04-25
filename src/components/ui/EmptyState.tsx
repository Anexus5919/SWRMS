import { ReactNode } from 'react';
import { EmptyStateIllustration } from '@/components/brand/Illustrations';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
  className?: string;
}

/**
 * EmptyState - used on lists with no data. Includes domain
 * illustration so the page never feels empty or broken.
 */
export default function EmptyState({
  title,
  description,
  action,
  illustration,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      <div className="w-32 h-32 mb-4 opacity-80">
        {illustration ?? <EmptyStateIllustration className="w-full h-full" />}
      </div>
      <h3 className="font-display text-base font-bold text-[var(--neutral-900)] max-w-sm">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
