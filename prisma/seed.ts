import { PrismaClient, GameStatus, CompletionType } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORMS = [
  { name: "PlayStation 5", slug: "ps5", family: "PlayStation" },
  { name: "PlayStation 4", slug: "ps4", family: "PlayStation" },
  { name: "PlayStation 3", slug: "ps3", family: "PlayStation" },
  { name: "Xbox Series X|S", slug: "xsx", family: "Xbox" },
  { name: "Xbox One", slug: "xbone", family: "Xbox" },
  { name: "Xbox 360", slug: "x360", family: "Xbox" },
  { name: "Nintendo Switch", slug: "switch", family: "Nintendo" },
  { name: "Nintendo Switch 2", slug: "switch2", family: "Nintendo" },
  { name: "Wii U", slug: "wiiu", family: "Nintendo" },
  { name: "Wii", slug: "wii", family: "Nintendo" },
  { name: "Nintendo 3DS", slug: "3ds", family: "Nintendo" },
  { name: "PC", slug: "pc", family: "PC" },
  { name: "Steam Deck", slug: "steam-deck", family: "PC" },
  { name: "iOS", slug: "ios", family: "Mobile" },
  { name: "Android", slug: "android", family: "Mobile" },
];

async function main() {
  console.log("→ Seeding platforms…");
  for (const p of PLATFORMS) {
    await prisma.platform.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // Create default single-user account
  const user = await prisma.user.upsert({
    where: { email: "me@gamelog.local" },
    update: {},
    create: { email: "me@gamelog.local", name: "Player One" },
  });
  console.log(`→ Default user: ${user.email}`);

  console.log("✓ Done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
