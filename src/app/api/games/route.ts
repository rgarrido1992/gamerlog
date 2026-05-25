import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GameStatus, CompletionType } from "@prisma/client";

export const runtime = "nodejs";

const CreateSchema = z.object({
  igdbId: z.number().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  coverUrl: z.string().url().nullable().optional(),
  releaseDate: z.string().datetime().nullable().optional(),
  summary: z.string().nullable().optional(),
  genres: z.array(z.string()).optional(),
  developers: z.array(z.string()).optional(),
  publishers: z.array(z.string()).optional(),
  platformSlug: z.string().nullable().optional(),
  status: z.nativeEnum(GameStatus),
  completion: z.nativeEnum(CompletionType).nullable().optional(),
  rating: z.number().int().min(0).max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = CreateSchema.parse(await req.json());

    // Upsert the Game record
    const game = await prisma.game.upsert({
      where: body.igdbId
        ? { igdbId: body.igdbId }
        : { slug: body.slug },
      update: {
        title: body.title,
        coverUrl: body.coverUrl ?? undefined,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
        summary: body.summary ?? undefined,
        genres: body.genres ?? undefined,
        developers: body.developers ?? undefined,
        publishers: body.publishers ?? undefined,
      },
      create: {
        igdbId: body.igdbId,
        title: body.title,
        slug: body.slug,
        coverUrl: body.coverUrl,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
        summary: body.summary,
        genres: body.genres ?? [],
        developers: body.developers ?? [],
        publishers: body.publishers ?? [],
      },
    });

    // Resolve platform
    let platformId: string | null = null;
    if (body.platformSlug) {
      const platform = await prisma.platform.findUnique({
        where: { slug: body.platformSlug },
      });
      platformId = platform?.id ?? null;
    }

    // Create the entry
    const entry = await prisma.gameEntry.create({
      data: {
        userId: user.id,
        gameId: game.id,
        platformId,
        status: body.status,
        completion: body.completion ?? null,
        rating: body.rating ?? null,
        notes: body.notes ?? null,
        startedAt:
          body.status === "STARTED" || body.status === "PLAYED" || body.status === "COMPLETED"
            ? new Date()
            : null,
        finishedAt: body.status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
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
