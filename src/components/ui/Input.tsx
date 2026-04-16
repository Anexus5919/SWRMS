import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-[var(--neutral-700)] mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`
            w-full px-3 py-2.5 text-sm border rounded
            bg-[var(--neutral-50)] text-[var(--neutral-900)]
            placeholder:text-[var(--neutral-400)]
            focus:outline-none focus:ring-2 focus:ring-bmc-500/30 focus:border-bmc-500
            transition-colors
            ${error ? 'border-status-red' : 'border-[var(--border)]'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-status-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
