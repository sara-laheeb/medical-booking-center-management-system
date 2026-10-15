export default function Input({
  as = 'input',
  hasError = false,
  hasSuccess = false,
  className = '',
  ...rest
}) {
  const Component = as;
  const classes = [
    'input',
    hasError ? 'input-error' : '',
    hasSuccess ? 'input-success' : '',
    className,
  ].filter(Boolean).join(' ');

  return <Component className={classes} {...rest} />;
}
