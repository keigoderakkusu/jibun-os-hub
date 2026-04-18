import { type ReactNode } from 'react';
import { Separator } from '../ui/separator';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="shrink-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--foreground))]">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[hsl(var(--foreground))]">{title}</h1>
            {description && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <Separator />
    </div>
  );
}
