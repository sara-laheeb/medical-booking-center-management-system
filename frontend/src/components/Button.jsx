export default function Button({
  as = 'button',
  variant = 'primary',
  size,
  icon,
  children,
  className = '',
  ...rest
}) {
  const Tag = as;
  const classes = ['btn', `btn-${variant}`, size ? `btn-${size}` : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
      {icon}
    </Tag>
  );
}
