import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightAddon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightAddon, id, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-[11px] font-bold text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={`
              w-full ${leftIcon ? 'pl-10' : 'px-3'} ${rightAddon ? 'pr-10' : 'pr-3'} py-2.5 text-sm
              border rounded-md bg-white text-[var(--text-primary)]
              placeholder:text-[var(--neutral-400)]
              focus:outline-none focus:border-bmc-600 focus:ring-2 focus:ring-bmc-500/20
              transition-all
              disabled:bg-[var(--surface-sunken)] disabled:cursor-not-allowed
              ${error ? 'border-status-red focus:border-status-red focus:ring-status-red/20' : 'border-[var(--border-strong)]'}
              ${className}
            `}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightAddon}</div>
          )}
        </div>
        {hint && !error && (
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-status-red flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
