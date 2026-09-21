import { forwardRef } from "react";
import { Link } from "react-router-dom";

// Mirrors the shadcn/ui button used in the Lovable redesign
// (ktebna-source/src/components/ui/button.tsx) so pages port 1:1.
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

const variants = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  trust: "bg-trust text-white shadow hover:bg-trust/90",
};

const sizes = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-12 rounded-md px-8 text-base",
  icon: "size-9",
};

const buttonClass = ({ variant = "default", size = "default", className = "" } = {}) =>
  `${base} ${variants[variant]} ${sizes[size]} ${className}`;

const Button = forwardRef(function Button(
  { variant, size, className, to, type = "button", ...props },
  ref,
) {
  const cls = buttonClass({ variant, size, className });
  if (to) return <Link ref={ref} to={to} className={cls} {...props} />;
  return <button ref={ref} type={type} className={cls} {...props} />;
});

export default Button;
