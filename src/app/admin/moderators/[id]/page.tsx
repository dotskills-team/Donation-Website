import { notFound } from "next/navigation";
import { ModeratorDetail } from "@/components/admin/moderator-detail";

export default async function ModeratorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  return <ModeratorDetail id={id} />;
}
