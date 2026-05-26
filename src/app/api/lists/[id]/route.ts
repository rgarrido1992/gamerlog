import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const PatchSchema = z.object({
  action: z.enum(["add", "remove", "rename"]),
  gameId: z.string().cuid().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = PatchSchema.parse(await req.json());

    const list = await prisma.gameList.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.action === "add" && body.gameId) {
      const count = await prisma.listItem.count({ where: { listId: list.id } });
      await prisma.listItem.upsert({
        where: { listId_gameId: { listId: list.id, gameId: body.gameId } },
        update: {},
        create: { listId: list.id, gameId: body.gameId, position: count },
      });
    } else if (body.action === "remove" && body.gameId) {
      await prisma.listItem.deleteMany({
        where: { listId: list.id, gameId: body.gameId },
      });
    } else if (body.action === "rename") {
      await prisma.gameList.update({
        where: { id: list.id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
        },
      });
    }

    await prisma.gameList.update({
      where: { id: list.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const existing = await prisma.gameList.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.gameList.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
