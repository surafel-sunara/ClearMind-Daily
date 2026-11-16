import { notFound } from "next/navigation";
import { findWordTheme, wordThemes } from "@/lib/puzzles/wordSearchGenerator";
import { gameMetadata } from "@/lib/seo";
import { WordSearchPage, type WordSearchParams } from "../WordSearchPage";

export function generateStaticParams() {
  return wordThemes.map(({ slug }) => ({ theme: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }) {
  const theme = findWordTheme((await params).theme);
  if (!theme) notFound();
  return gameMetadata("word-search", {
    name: theme.title + " Word Search",
    path: "/games/word-search/" + theme.slug,
    description: "Find " + theme.title.toLowerCase() + " words in a free, large-print Word Search puzzle. New puzzles every day.",
  });
}

export default async function Page({ params, searchParams }: {
  params: Promise<{ theme: string }>; searchParams: Promise<WordSearchParams>;
}) {
  const theme = findWordTheme((await params).theme);
  if (!theme) notFound();
  return <WordSearchPage theme={theme} query={await searchParams} />;
}
