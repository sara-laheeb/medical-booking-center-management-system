export function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  style = {},
  ...rest
}) {
  return (
    <div
      className={`skel ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="card stat-card" aria-hidden="true">
      <div className="skel skel-icon" />
      <div className="skel skel-value" />
      <div className="skel skel-label" />
    </div>
  );
}

export function SkeletonAccentCard() {
  return (
    <div className="card accent-card" aria-hidden="true" style={{ alignItems: 'center' }}>
      <div className="skel skel-avatar" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skel skel-line" style={{ width: '60%' }} />
        <div className="skel skel-line" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

export default Skeleton;
