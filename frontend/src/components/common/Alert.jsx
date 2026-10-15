export default function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  icon,
  ...rest
}) {
  return (
    <div className={`alert alert-${variant} ${className}`.trim()} role="alert" {...rest}>
      {icon && <div className="alert-icon">{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <b>{title}</b>}
        {children && <span className="body-text">{children}</span>}
      </div>
    </div>
  );
}
