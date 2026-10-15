export default function StatCard({
  icon,
  value,
  label,
  delta,
  trend = 'up',
  featured = false,
  featuredTag,
  sparkline = false,
  className = '',
  ...rest
}) {
  const classes = [
    'card',
    'stat-card',
    featured ? 'featured' : '',
    className,
  ].filter(Boolean).join(' ');

  const deltaClass = trend === 'up' ? 'stat-up' : trend === 'down' ? 'stat-down' : '';

  return (
    <div className={classes} {...rest}>
      {featured && featuredTag && (
        <span className="featured-tag">{featuredTag}</span>
      )}

      {icon && (
        <div className="stat-icon">
          {icon}
        </div>
      )}

      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>

      {delta && (
        <div className={`stat-delta ${deltaClass}`.trim()}>
          {delta}
        </div>
      )}

      {sparkline && (
        <div className="sparkline" aria-hidden="true">
          <span style={{ height: '35%' }} />
          <span style={{ height: '55%' }} />
          <span style={{ height: '40%' }} />
          <span style={{ height: '70%' }} />
          <span style={{ height: '60%' }} />
          <span style={{ height: '85%' }} />
          <span style={{ height: '100%' }} />
        </div>
      )}
    </div>
  );
}
