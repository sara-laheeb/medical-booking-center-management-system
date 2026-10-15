export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  ...rest
}) {
  return (
    <div className={`empty-state ${className}`.trim()} {...rest}>
      {icon && <div className="empty-icon">{icon}</div>}
      {title && <div className="empty-title">{title}</div>}
      {description && <div className="empty-desc">{description}</div>}
      {action && <div style={{ marginTop: 'var(--sp-2)' }}>{action}</div>}
    </div>
  );
}
