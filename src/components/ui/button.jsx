import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B]/30 disabled:pointer-events-none disabled:opacity-55 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[#7B1E2B] text-white hover:bg-[#661722] active:bg-[#56131C] shadow-2xs',
        destructive:
          'bg-[#A61C1C] text-white hover:bg-[#8E1717] active:bg-[#781313] shadow-2xs',
        outline:
          'border border-[#D8D5CE] bg-white text-[#7B1E2B] hover:bg-[#FAF8F5] hover:border-[#C5C0B7]',
        secondary:
          'bg-[#F5E4E6] text-[#7B1E2B] hover:bg-[#EDD3D6]',
        ghost:
          'text-[#1C242B] hover:bg-black/5',
        link:
          'text-[#7B1E2B] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-11 px-6 text-xs',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
