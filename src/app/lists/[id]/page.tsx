import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ListDetailClient } from "./ListDetailClient";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const list = await prisma.gameList.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      items: {
        include: {
          game: {
            include: {
              entries: { where: { userId: user.id }, take: 1 },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!list) notFound();

  return (
    <ListDetailClient
      list={{
        id: list.id,
        name: list.name,
        description: list.description,
      }}
      items={list.items.map((i) => ({
        gameId: i.gameId,
        title: i.game.title,
        coverUrl: i.game.manualCoverUrl ?? i.game.coverUrl,
        year: i.game.releaseDate?.getFullYear() ?? null,
        entryId: i.game.entries[0]?.id ?? null,
        status: i.game.entries[0]?.status ?? null,
      }))}
    />
  );
}
