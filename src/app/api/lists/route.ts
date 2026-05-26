import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = CreateSchema.parse(await req.json());

    const list = await prisma.gameList.create({
      data: {
        userId: user.id,
        name: body.name,
        description: body.description ?? null,
      },
    });
    return NextResponse.json({ list }, { status: 201 });
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

export async function GET() {
  const user = await getCurrentUser();
  const lists = await prisma.gameList.findMany({
    where: { userId: user.id },
    include: { items: { include: { game: true }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ lists });
}
