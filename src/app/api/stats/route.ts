import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { getViewer } from "@/lib/viewer";
import { prisma } from "@/lib/prisma";
import { siteUrl, type GameType } from "@/lib/catalog";
import { isBetter, isGameResult, resultKey, type GameResult } from "@/lib/progress";
import { utcDate } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const { user } = await getViewer();
  if (!user?.syncScores) return Response.json({ error: "Score sync is off." }, { status: 403, headers });

  const [scores, days] = await Promise.all([
    prisma.dailyScore.findMany({ where: { userId: user.id }, orderBy: { playedOn: "desc" } }),
    prisma.activityDay.findMany({ where: { userId: user.id } }),
  ]);
  return Response.json({
    results: scores.map((row): GameResult => ({
      game: row.gameType as GameType, variant: row.variant, date: utcDate(row.puzzleDate),
      playedOn: utcDate(row.playedOn), score: row.score, seconds: row.timeSeconds,
    })),
    activity: days.map((row) => ({ game: row.gameType, playedOn: utcDate(row.playedOn) })),
  }, { headers });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== siteUrl().origin
      || !request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Invalid origin or request." }, { status: 403, headers });
  }
  const { user } = await getViewer();
  if (!user?.syncScores) return Response.json({ error: "Score sync is off." }, { status: 403, headers });
  let results: unknown;
  try {
    const body = await request.text();
    if (body.length > 20_000) return Response.json({ error: "Too many scores." }, { status: 413, headers });
    results = JSON.parse(body)?.results;
  } catch {
    return Response.json({ error: "Invalid scores." }, { status: 400, headers });
  }
  const today = utcDate();
  if (!Array.isArray(results) || results.length < 1 || results.length > 50
      || !results.every((row) => isGameResult(row, today))) {
    return Response.json({ error: "Invalid scores." }, { status: 400, headers });
  }

  const scores = new Map<string, GameResult>();
  for (const result of results as GameResult[]) {
    const key = resultKey(result);
    if (isBetter(scores.get(key), result)) scores.set(key, result);
  }
  const saved = await prisma.$transaction(async (tx) => {
    const enabled = await tx.$queryRaw<{ syncScores: boolean }[]>`
      SELECT "syncScores" FROM "User" WHERE "id" = ${user.id} FOR UPDATE
    `;
    if (!enabled[0]?.syncScores) return false;
    const values = Array.from(scores.values(), ({ game, variant, date, playedOn, score, seconds }) =>
      Prisma.sql`(${randomUUID()}, ${user.id}, ${game}, ${variant}, ${date}::date, ${playedOn}::date, ${score}, ${seconds})`,
    );
    await tx.$executeRaw`
      INSERT INTO "DailyScore" ("id", "userId", "gameType", "variant", "puzzleDate", "playedOn", "score", "timeSeconds")
      VALUES ${Prisma.join(values)}
      ON CONFLICT ("userId", "gameType", "variant", "puzzleDate") DO UPDATE
        SET "score" = EXCLUDED."score", "timeSeconds" = EXCLUDED."timeSeconds", "playedOn" = EXCLUDED."playedOn"
      WHERE EXCLUDED."score" > "DailyScore"."score"
        OR (EXCLUDED."score" = "DailyScore"."score" AND EXCLUDED."timeSeconds" < "DailyScore"."timeSeconds")
    `;
    await tx.activityDay.createMany({
      data: (results as GameResult[]).map(({ game, playedOn }) => ({
        userId: user.id, gameType: game, playedOn: new Date(playedOn + "T00:00:00Z"),
      })),
      skipDuplicates: true,
    });
    return true;
  });
  return saved ? Response.json({ saved: true }, { headers })
    : Response.json({ error: "Score sync is off." }, { status: 403, headers });
}
