import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GameStatus, CompletionType } from "@prisma/client";
import { fetchOpenCriticByTitle } from "@/lib/opencritic";

export const runtime = "nodejs";

const CreateSchema = z.object({
  // Game data (from IGDB or manual)
  igdbId: z.number().nullable().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  coverUrl: z.string().url().nullable().optional(),
  artworkUrl: z.string().url().nullable().optional(),
  screenshots: z.array(z.string().url()).optional(),
  videoYoutubeId: z.string().nullable().optional(),
  releaseDate: z.string().datetime().nullable().optional(),
  summary: z.string().nullable().optional(),
  igdbRating: z.number().nullable().optional(),
  genres: z.array(z.string()).optional(),
  gameModes: z.array(z.string()).optional(),
  developers: z.array(z.string()).optional(),
  publishers: z.array(z.string()).optional(),
  igdbPlatformIds: z.array(z.number()).optional(),
  similarIgdbIds: z.array(z.number()).optional(),

  // Entry data
  platformSlug: z.string().nullable().optional(),
  status: z.nativeEnum(GameStatus),
  completion: z.nativeEnum(CompletionType).nullable().optional(),
  startedAt: z.string().datetime().nullable().optional(),
  finishedAt: z.string().datetime().nullable().optional(),
  rating: z.number().int().min(0).max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = CreateSchema.parse(await req.json());

    // OpenCritic lookup (best effort, non-blocking failure)
    let openCriticData: { id: number; score: number | null; tier: string | null; url: string | null } | null = null;
    try {
      openCriticData = await fetchOpenCriticByTitle(body.title);
    } catch {
      // ignore — keep going without OC data
    }

    // Upsert the Game
    const game = await prisma.game.upsert({
      where: body.igdbId
        ? { igdbId: body.igdbId }
        : { slug: body.slug },
      update: {
        title: body.title,
        coverUrl: body.coverUrl ?? undefined,
        artworkUrl: body.artworkUrl ?? undefined,
        screenshots: body.screenshots ?? undefined,
        videoYoutubeId: body.videoYoutubeId ?? undefined,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
        summary: body.summary ?? undefined,
        igdbRating: body.igdbRating ?? undefined,
        genres: body.genres ?? undefined,
        gameModes: body.gameModes ?? undefined,
        developers: body.developers ?? undefined,
        publishers: body.publishers ?? undefined,
        similarIgdbIds: body.similarIgdbIds ?? undefined,
        ...(openCriticData && {
          openCriticId: openCriticData.id,
          openCriticScore: openCriticData.score,
          openCriticTier: openCriticData.tier,
          openCriticUrl: openCriticData.url,
        }),
      },
      create: {
        igdbId: body.igdbId ?? null,
        title: body.title,
        slug: body.slug,
        coverUrl: body.coverUrl,
        artworkUrl: body.artworkUrl,
        screenshots: body.screenshots ?? [],
        videoYoutubeId: body.videoYoutubeId,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
        summary: body.summary,
        igdbRating: body.igdbRating,
        genres: body.genres ?? [],
        gameModes: body.gameModes ?? [],
        developers: body.developers ?? [],
        publishers: body.publishers ?? [],
        similarIgdbIds: body.similarIgdbIds ?? [],
        ...(openCriticData && {
          openCriticId: openCriticData.id,
          openCriticScore: openCriticData.score,
          openCriticTier: openCriticData.tier,
          openCriticUrl: openCriticData.url,
        }),
      },
    });

    // Link game ↔ platforms based on IGDB platform IDs
    if (body.igdbPlatformIds && body.igdbPlatformIds.length > 0) {
      const platforms = await prisma.platform.findMany({
        where: { igdbIds: { hasSome: body.igdbPlatformIds } },
      });
      for (const p of platforms) {
        await prisma.gamePlatform.upsert({
          where: { gameId_platformId: { gameId: game.id, platformId: p.id } },
          update: {},
          create: { gameId: game.id, platformId: p.id },
        });
      }
    }

    // Resolve platform for entry
    let platformId: string | null = null;
    if (body.platformSlug) {
      const platform = await prisma.platform.findUnique({
        where: { slug: body.platformSlug },
      });
      platformId = platform?.id ?? null;
    }

    // Determine dates
    const startedAt = body.startedAt
      ? new Date(body.startedAt)
      : (body.status === "STARTED" || body.status === "PLAYED" || body.status === "COMPLETED")
      ? new Date()
      : null;

    const finishedAt = body.finishedAt
      ? new Date(body.finishedAt)
      : body.status === "COMPLETED"
      ? new Date()
      : null;

    const entry = await prisma.gameEntry.create({
      data: {
        userId: user.id,
        gameId: game.id,
        platformId,
        status: body.status,
        completion: body.completion ?? null,
        rating: body.rating ?? null,
        notes: body.notes ?? null,
        startedAt,
        finishedAt,
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
