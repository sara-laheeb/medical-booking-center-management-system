export function Card({
  children,
  className = '',
  pad = false,
  ...rest
}) {
  const classes = [
    'card',
    pad ? 'pad' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export function AccentCard({
  status = 'confirmed',
  avatar,
  title,
  subtitle,
  meta,
  children,
  className = '',
  ...rest
}) {
  const classes = [
    'card',
    'accent-card',
    `status-${status}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {avatar && (
        <div className="avatar">
          {avatar}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div className="ac-title">{title}</div>}
        {subtitle && <div className="ac-sub">{subtitle}</div>}
        {meta && <div className="ac-meta">{meta}</div>}
        {children}
      </div>
    </div>
  );
}

export default Card;
