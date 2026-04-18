import { type HTMLAttributes } from 'react';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default: 'border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
  secondary: 'border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
  destructive: 'border-transparent bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]',
  outline: 'text-[hsl(var(--foreground))]',
  success: 'border-transparent bg-emerald-100 text-emerald-700',
  warning: 'border-transparent bg-amber-100 text-amber-700',
};

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
