import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isAllowedPlayerKey } from "@/lib/pro-map";
import CompareProClient from "./CompareProClient";

type Props = { params: Promise<{ playerKey: string }> };

export default async function CompareProPage({ params }: Props) {
  const { playerKey } = await params;
  if (!isAllowedPlayerKey(playerKey)) notFound();
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <CompareProClient playerKey={playerKey} />
    </Suspense>
  );
}
