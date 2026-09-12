'use client';

import { Suspense } from 'react';
import WatchContent from './WatchContent';

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 28, width: '70%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 16, width: '40%' }} />
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
