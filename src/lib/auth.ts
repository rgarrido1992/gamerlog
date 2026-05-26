import { prisma } from "./prisma";

export async function getCurrentUser() {
  if (process.env.SINGLE_USER_MODE !== "false") {
    let user = await prisma.user.findUnique({
      where: { email: "me@memorycard.local" },
    });
    // Backwards compat: previous email used in earlier seed
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: "me@gamelog.local" },
      });
    }
    if (!user) {
      throw new Error(
        "Default user not found. Run `npm run db:seed` to initialize."
      );
    }
    return user;
  }
  throw new Error("Multi-user mode not yet implemented");
}
