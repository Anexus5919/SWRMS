interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Skeleton - shimmer loader for use during data fetching.
 * Use composed Skeleton blocks rather than full-page spinners.
 */
export function Skeleton({
  className = '',
  height = 'h-4',
  width = 'w-full',
  rounded = 'md',
}: SkeletonProps) {
  const radius = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];
  return <div className={`skeleton ${height} ${width} ${radius} ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white border border-[var(--border)] rounded-lg p-5 ${className}`}>
      <Skeleton height="h-5" width="w-24" />
      <Skeleton height="h-3" width="w-full" className="mt-3" />
      <Skeleton height="h-3" width="w-4/5" className="mt-2" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton height="h-3" width="w-16" />
        <Skeleton height="h-6" width="w-12" rounded="lg" />
      </div>
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height="h-3" width={i === 0 ? 'w-24' : 'w-full'} />
        </td>
      ))}
    </tr>
  );
}
