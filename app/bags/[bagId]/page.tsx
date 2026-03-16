"use client";

import { useParams } from "next/navigation";
import BagDetailClient from "./BagDetailClient";

export default function BagDetailPage() {
  const params = useParams();
  const bagId = typeof params?.bagId === "string" ? params.bagId : "";
  return <BagDetailClient bagId={bagId} />;
}
