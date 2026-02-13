import { Suspense } from "react";

export default function WitbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>読み込み中...</div>}>
      {children}
    </Suspense>
  );
}
