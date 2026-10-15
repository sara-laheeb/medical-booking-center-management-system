export default function FormField({
  label,
  error,
  success,
  hint,
  children,
  className = '',
  required = false,
  ...rest
}) {
  return (
    <div className={`field ${className}`.trim()} {...rest}>
      {label && (
        <label>
          {label}
          {required && <span style={{ color: 'var(--error-500)', marginInlineStart: 4 }}>*</span>}
        </label>
      )}

      {children}

      {error && (
        <div className="error-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!error && success && (
        <div className="success-text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {!error && !success && hint && (
        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          {hint}
        </span>
      )}
    </div>
  );
}
