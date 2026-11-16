import { gameCatalog, gamePath, siteUrl, SITE_DESCRIPTION, SITE_NAME, type GameType } from "@/lib/catalog";

export function StructuredData({ game, name, path, description }: {
  game?: GameType; name?: string; path?: string; description?: string;
}) {
  const data = game ? {
    "@context": "https://schema.org",
    "@type": "Game",
    name: name ?? gameCatalog[game].name,
    url: siteUrl(path ?? gamePath(game)).href,
    description: description ?? gameCatalog[game].description,
    inLanguage: "en-US",
    gamePlatform: "Web browser",
    numberOfPlayers: { "@type": "QuantitativeValue", value: 1 },
    isAccessibleForFree: true,
  } : {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: siteUrl().href,
    description: SITE_DESCRIPTION,
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: "en-US",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
