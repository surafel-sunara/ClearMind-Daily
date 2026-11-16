import { GameHeading, GameInstructions, getGameDate } from "@/components/GameShell";
import { StructuredData } from "@/components/StructuredData";
import { SolitaireGame } from "@/components/games/SolitaireGame";
import { queryValue } from "@/lib/catalog";
import { utcDate } from "@/lib/seed";
import { gameMetadata } from "@/lib/seo";
import { getViewer } from "@/lib/viewer";

export const metadata = gameMetadata("solitaire");

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { isPro } = await getViewer();
  const today = utcDate();
  const { date, notice } = getGameDate(queryValue((await searchParams).date), today, isPro);
  return <div className="frame page game-page">
    <StructuredData game="solitaire" />
    <GameHeading game="solitaire" introduction="Classic Klondike with large cards and simple tap-to-move controls."
      date={date} today={today} path="/games/solitaire" isPro={isPro} notice={notice} />
    <SolitaireGame key={date} date={date} today={today} />
    <GameInstructions game="solitaire" isPro={isPro} />
  </div>;
}
