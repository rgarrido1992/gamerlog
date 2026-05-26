import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ListsClient } from "./ListsClient";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const user = await getCurrentUser();
  const lists = await prisma.gameList.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: { game: true },
        orderBy: { position: "asc" },
        take: 4,
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ListsClient
      lists={lists.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
        itemCount: l._count.items,
        previews: l.items.map((i) => ({
          gameId: i.gameId,
          title: i.game.title,
          coverUrl: i.game.manualCoverUrl ?? i.game.coverUrl,
        })),
      }))}
    />
  );
}
