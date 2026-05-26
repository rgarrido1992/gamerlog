import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GameStatus, CompletionType } from "@prisma/client";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  platformSlug: z.string().nullable().optional(),
  status: z.nativeEnum(GameStatus).optional(),
  completion: z.nativeEnum(CompletionType).nullable().optional(),
  startedAt: z.string().datetime().nullable().optional(),
  finishedAt: z.string().datetime().nullable().optional(),
  rating: z.number().int().min(0).max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = UpdateSchema.parse(await req.json());

    const existing = await prisma.gameEntry.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let platformId: string | null | undefined = undefined;
    if (body.platformSlug !== undefined) {
      if (!body.platformSlug) {
        platformId = null;
      } else {
        const p = await prisma.platform.findUnique({ where: { slug: body.platformSlug } });
        platformId = p?.id ?? null;
      }
    }

    const updated = await prisma.gameEntry.update({
      where: { id: params.id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.completion !== undefined && { completion: body.completion }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(platformId !== undefined && { platformId }),
        ...(body.startedAt !== undefined && {
          startedAt: body.startedAt ? new Date(body.startedAt) : null,
        }),
        ...(body.finishedAt !== undefined && {
          finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
        }),
      },
    });
    return NextResponse.json({ entry: updated });
  } catch (err) {
    console.error(err);
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
    const existing = await prisma.gameEntry.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.gameEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
