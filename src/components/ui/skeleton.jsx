import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[#EBE8E1]', className)}
      {...props}
    />
  );
}

export { Skeleton };
