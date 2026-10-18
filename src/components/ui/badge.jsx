import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-granate-700 text-white shadow',
        secondary:
          'border-zinc-200 bg-zinc-100 text-zinc-800',
        outline:
          'border-zinc-200 text-zinc-700 bg-white',
        nuevo:
          'border-[#f3c6cf] bg-[#fdf2f4] text-[#7a1428]',
        asignado:
          'border-blue-200 bg-blue-50 text-blue-700',
        en_proceso:
          'border-amber-200 bg-amber-50 text-amber-800',
        resuelto:
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        cerrado:
          'border-green-200 bg-green-50 text-green-800',
        rechazado:
          'border-red-200 bg-red-50 text-red-700'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
