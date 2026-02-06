import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      default:
        'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30',
      destructive:
        'bg-red-500 text-white hover:bg-red-600 shadow-md',
      outline:
        'border border-gray-200 bg-white/50 hover:bg-white/80 text-gray-700',
      secondary:
        'bg-gray-100 text-gray-900 hover:bg-gray-200',
      ghost:
        'hover:bg-gray-100 text-gray-700',
      link:
        'text-primary-600 underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-5 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-12 rounded-xl px-8 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
