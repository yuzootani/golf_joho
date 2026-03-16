import BagDetailClient from "./BagDetailClient";

type Props = { params: Promise<{ bagId: string }> };

export default async function BagDetailPage({ params }: Props) {
  const { bagId } = await params;
  return <BagDetailClient bagId={bagId} />;
}
