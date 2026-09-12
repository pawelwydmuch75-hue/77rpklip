export async function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
