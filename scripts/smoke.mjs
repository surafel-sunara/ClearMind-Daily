import assert from "node:assert/strict";

const origin = process.env.APP_URL || "http://localhost:3000";
const routes = [
  "/", "/games/word-search", "/games/sudoku", "/games/solitaire", "/games/trivia",
  "/club", "/printables", "/sitemap.xml", "/robots.txt", "/games/word-search/garden-flowers",
];

for (const path of routes) {
  const response = await fetch(new URL(path, origin), { redirect: "manual", signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, 200, path);
  const body = await response.text();
  assert.ok(body.length > 0, path);
  if (path === "/sitemap.xml") assert.match(body, /games\/word-search\/garden-flowers/);
  console.log(response.status, path);
}
