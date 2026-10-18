import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function Loading({ text }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={text || 'Cargando'}>
      {[1, 2].map((idx) => (
        <Card key={idx} className="p-5 space-y-2.5">
          <Skeleton className="h-3.5 w-44" />
          <Skeleton className="h-5 w-72 max-w-full" />
          <Skeleton className="h-3.5 w-52" />
        </Card>
      ))}
    </div>
  );
}

export default Loading;
