import { prisma } from "@/lib/prisma";
import { AddGameClient } from "./AddGameClient";

export default async function AddPage() {
  const platforms = await prisma.platform.findMany({
    orderBy: [{ family: "asc" }, { name: "asc" }],
  });
  return <AddGameClient platforms={platforms.map((p) => ({ slug: p.slug, name: p.name }))} />;
}
