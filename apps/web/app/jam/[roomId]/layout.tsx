import { JammingProvider } from '@/components/JammingProvider';


export default function JammingRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <JammingProvider>
      {children}
    </JammingProvider>
  );
}
