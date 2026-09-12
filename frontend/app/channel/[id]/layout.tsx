export async function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function ChannelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
