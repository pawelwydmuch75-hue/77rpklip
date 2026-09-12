'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import WatchContent from '../WatchContent';

function WatchIdInner() {
  const params = useParams<{ id: string }>();
  return <WatchContent initialId={params?.id} />;
}

export default function WatchIdPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 28, width: '70%', marginBottom: 12 }} />
      </div>
    }>
      <WatchIdInner />
    </Suspense>
  );
}
