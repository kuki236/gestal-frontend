import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-3.5 text-xs',
  {
    variants: {
      variant: {
        default: 'border-[#D8D5CE] bg-white text-[#1C242B]',
        destructive: 'border-[#E9B8B8] bg-[#F7E6E6] text-[#A61C1C]',
        success: 'border-[#B7DEC9] bg-[#E6F2EC] text-[#1E6B47]',
        warning: 'border-[#F0DCAC] bg-[#FAF0D7] text-[#8D5811]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('text-xs font-extrabold leading-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('mt-1 text-xs leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
