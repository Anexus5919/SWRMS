import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-[var(--text-muted)] hover:text-bmc-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <svg className="w-3 h-3 text-[var(--border-strong)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </span>
        );
      })}
    </nav>
  );
}
