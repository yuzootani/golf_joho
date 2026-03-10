import { notFound } from "next/navigation";
import { isAllowedPlayerKey } from "@/lib/pro-map";
import CompareProClient from "./CompareProClient";

type Props = { params: Promise<{ playerKey: string }> };

export default async function CompareProPage({ params }: Props) {
  const { playerKey } = await params;
  if (!isAllowedPlayerKey(playerKey)) notFound();
  return <CompareProClient playerKey={playerKey} />;
}
