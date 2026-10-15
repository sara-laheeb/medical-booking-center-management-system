export default function Badge({
  variant = 'confirmed',
  children,
  className = '',
  ...rest
}) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
}
