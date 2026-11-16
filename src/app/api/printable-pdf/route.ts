import { makePuzzlePdf } from "@/lib/printablePdf";
import { archiveDates, isDateKey, utcDate } from "@/lib/seed";
import { getViewer } from "@/lib/viewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const { user, isPro } = await getViewer();
  if (!user) return Response.json({ error: "Sign in to download your printable pack." }, { status: 401, headers: privateHeaders });
  if (!isPro) return Response.json({ error: "Printable packs are included with the Ad-Free Club." }, { status: 403, headers: privateHeaders });
  const today = utcDate();
  const date = new URL(request.url).searchParams.get("date") ?? today;
  if (!isDateKey(date) || (date !== today && !archiveDates(today).includes(date))) {
    return Response.json({ error: "Choose today or one of the previous seven days." }, { status: 400, headers: privateHeaders });
  }
  return new Response(makePuzzlePdf(date), {
    headers: {
      ...privateHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="clearmind-daily-' + date + '.pdf"',
    },
  });
}
