import { gameMetadata } from "@/lib/seo";
import { WordSearchPage, type WordSearchParams } from "./WordSearchPage";

export const metadata = gameMetadata("word-search");

export default async function Page({ searchParams }: { searchParams: Promise<WordSearchParams> }) {
  return <WordSearchPage query={await searchParams} />;
}
