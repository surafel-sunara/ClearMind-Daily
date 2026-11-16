import { AdSlot } from "@/components/AdSlot";
import { GameHeading, GameInstructions, getGameDate } from "@/components/GameShell";
import { StructuredData } from "@/components/StructuredData";
import { NostalgiaTriviaGame } from "@/components/games/NostalgiaTriviaGame";
import { queryValue } from "@/lib/catalog";
import { utcDate } from "@/lib/seed";
import { gameMetadata } from "@/lib/seo";
import { getViewer } from "@/lib/viewer";

export const metadata = gameMetadata("trivia");

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { isPro } = await getViewer();
  const today = utcDate();
  const { date, notice } = getGameDate(queryValue((await searchParams).date), today, isPro);
  return <div className="frame page game-page">
    <StructuredData game="trivia" />
    <GameHeading game="trivia" introduction="Five questions about the music, shows, and moments you remember."
      date={date} today={today} path="/games/trivia" isPro={isPro} notice={notice} />
    <div className="trivia-layout">
      <NostalgiaTriviaGame key={date} date={date} today={today} />
      <AdSlot isPro={isPro} format="rectangle" />
    </div>
    <GameInstructions game="trivia" isPro={isPro} ad={false} />
  </div>;
}
