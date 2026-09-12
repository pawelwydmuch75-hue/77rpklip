'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import ChannelContent from '../ChannelContent';

function ChannelIdInner() {
  const params = useParams();
  return <ChannelContent initialId={params?.id as string} />;
}

export default function ChannelIdPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 80, width: 80, borderRadius: '50%' }} />
      </div>
    }>
      <ChannelIdInner />
    </Suspense>
  );
}
