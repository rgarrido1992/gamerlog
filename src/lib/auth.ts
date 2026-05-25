import { prisma } from "./prisma";

/**
 * In single-user mode (default), we always return the seeded user.
 * When SINGLE_USER_MODE=false, this is where session lookup will go.
 */
export async function getCurrentUser() {
  if (process.env.SINGLE_USER_MODE !== "false") {
    const user = await prisma.user.findUnique({
      where: { email: "me@gamelog.local" },
    });
    if (!user) {
      throw new Error(
        "Default user not found. Run `npm run db:seed` to initialize."
      );
    }
    return user;
  }
  // TODO: when opening registrations, wire NextAuth session here
  throw new Error("Multi-user mode not yet implemented");
}
