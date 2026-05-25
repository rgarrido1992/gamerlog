import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const SessionSchema = z.object({
  entryId: z.string().cuid(),
  playedAt: z.string().datetime(),
  durationMinutes: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = SessionSchema.parse(await req.json());

    // Verify ownership
    const entry = await prisma.gameEntry.findFirst({
      where: { id: body.entryId, userId: user.id },
    });
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const session = await prisma.playSession.create({
      data: {
        entryId: body.entryId,
        playedAt: new Date(body.playedAt),
        durationMinutes: body.durationMinutes ?? null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
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
