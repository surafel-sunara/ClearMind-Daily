import { getDailySeed, mulberry32, shuffle, type Random } from "../seed";

export const wordThemes = [
  { slug: "classic-movies", title: "Classic Movies", words: ["CASABLANCA", "GODFATHER", "GLADIATOR", "PSYCHO", "JAWS", "ROCKY", "CHARADE", "FANTASIA", "PINOCCHIO", "CAMELOT", "VERTIGO", "SHANE", "SPARTACUS", "GOLDFINGER", "GODZILLA"] },
  { slug: "sixties-hits", title: "1960s Hits", words: ["BEATLES", "SUPREMES", "MOTOWN", "SATISFACTION", "DOWNTOWN", "RESPECT", "YESTERDAY", "HEY JUDE", "BARBARA ANN", "VENUS", "SHERRY", "MONKEES", "SUGAR SUGAR", "STAND BY ME", "SOUNDS"] },
  { slug: "garden-flowers", title: "Garden Flowers", words: ["DAHLIA", "MARIGOLD", "TULIP", "PEONY", "DAISY", "CROCUS", "LAVENDER", "LILAC", "HIBISCUS", "PANSY", "VIOLET", "PETUNIA", "CAMELLIA", "ASTER", "PRIMROSE"] },
  { slug: "kitchen-classics", title: "Kitchen Classics", words: ["APRON", "COLANDER", "KETTLE", "WHISK", "SKILLET", "COOKBOOK", "SPATULA", "SAUCEPAN", "TEAPOT", "LADLE", "GRATER", "OVEN MITT", "MEASURING CUP", "ROLLING PIN", "TRIVET"] },
  { slug: "us-states", title: "U.S. States", words: ["CALIFORNIA", "TEXAS", "OREGON", "ALASKA", "VERMONT", "FLORIDA", "ARIZONA", "MONTANA", "NEVADA", "KENTUCKY", "TENNESSEE", "VIRGINIA", "COLORADO", "MICHIGAN", "MAINE"] },
  { slug: "famous-landmarks", title: "Famous Landmarks", words: ["BIG BEN", "TAJ MAHAL", "STONEHENGE", "ALCATRAZ", "COLOSSEUM", "EIFFEL TOWER", "ANGKOR WAT", "ACROPOLIS", "VERSAILLES", "MOUNT FUJI", "NOTRE DAME", "GREAT WALL", "RED SQUARE", "GOLDEN GATE", "BIG SUR"] },
  { slug: "cozy-autumn", title: "Cozy Autumn", words: ["PUMPKIN", "SWEATER", "CHESTNUT", "HARVEST", "CIDER", "ACORN", "SCARF", "MAPLE", "BONFIRE", "PERSIMMON", "CINNAMON", "LEAVES", "COBBLER", "CARDIGAN", "CORN MAZE"] },
  { slug: "birdwatching", title: "Birdwatching", words: ["ROBIN", "FINCH", "CARDINAL", "ORIOLE", "BLUEBIRD", "SPARROW", "WOODPECKER", "BLACKBIRD", "STARLING", "SWALLOW", "PELICAN", "GOLDFINCH", "NUTHATCH", "KINGFISHER", "CHICKADEE"] },
  { slug: "baking-day", title: "Baking Day", words: ["BISCUIT", "BROWNIE", "MUFFIN", "SOURDOUGH", "VANILLA", "CHOCOLATE", "CUPCAKE", "GINGERBREAD", "YEAST", "FROSTING", "SHORTBREAD", "SUGAR", "BUTTER", "BATTER", "PASTRY"] },
  { slug: "ocean-life", title: "Ocean Life", words: ["DOLPHIN", "STARFISH", "OCTOPUS", "SEAHORSE", "MANATEE", "LOBSTER", "JELLYFISH", "ANEMONE", "TURTLE", "NARWHAL", "MACKEREL", "MANTA RAY", "PLANKTON", "SARDINE", "SEA LION"] },
  { slug: "national-parks", title: "National Parks", words: ["YOSEMITE", "YELLOWSTONE", "ACADIA", "ZION", "SEQUOIA", "EVERGLADES", "DENALI", "GRAND TETON", "CRATER LAKE", "JOSHUA TREE", "MESA VERDE", "BADLANDS", "DRY TORTUGAS", "OLYMPIC", "REDWOOD"] },
  { slug: "music-room", title: "Music Room", words: ["PIANO", "GUITAR", "VIOLIN", "TRUMPET", "CLARINET", "HARMONICA", "MANDOLIN", "TROMBONE", "UKULELE", "TAMBOURINE", "BASSOON", "SAXOPHONE", "ACCORDION", "FLUTE", "CELLO"] },
  { slug: "farmers-market", title: "Farmers’ Market", words: ["PEACH", "NECTARINE", "STRAWBERRY", "BLUEBERRY", "CUCUMBER", "CARROT", "PARSNIP", "TOMATO", "RADISH", "CABBAGE", "APRICOT", "ZUCCHINI", "WATERMELON", "BLACKBERRY", "SHALLOT"] },
  { slug: "train-travel", title: "Train Travel", words: ["RAILWAY", "STATION", "TICKET", "SLEEPER", "CONDUCTOR", "LOCOMOTIVE", "PLATFORM", "SIGNAL", "CARRIAGE", "CABOOSE", "TUNNEL", "FREIGHT", "JUNCTION", "COACH", "TIMETABLE"] },
  { slug: "sewing-basket", title: "Sewing Basket", words: ["NEEDLE", "THREAD", "BUTTON", "THIMBLE", "SCISSORS", "FABRIC", "DENIM", "RIBBON", "ZIPPER", "PATTERN", "LACING", "SEAM RIPPER", "BOBBIN", "PIN CUSHION", "MEASURE"] },
  { slug: "stargazing", title: "Stargazing", words: ["JUPITER", "VENUS", "SATURN", "NEPTUNE", "ORION", "METEOR", "ECLIPSE", "AURORA", "CASSIOPEIA", "TELESCOPE", "MILKY WAY", "POLARIS", "ANDROMEDA", "GALAXY", "COMET"] },
] as const;

export type WordTheme = typeof wordThemes[number];
export type WordSize = 10 | 12;
export type HiddenWord = { text: string; letters: string; cells: number[] };
export type WordPuzzle = { grid: string[]; words: HiddenWord[]; theme: WordTheme; size: WordSize };
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const easyDirections = [[0, 1], [1, 0], [1, 1]];
const allDirections = [...easyDirections, [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];

export function findWordTheme(slug: string | undefined): WordTheme | undefined {
  return wordThemes.find((theme) => theme.slug === slug);
}

export function dailyTheme(date: string) {
  return wordThemes[Math.floor(mulberry32(getDailySeed("daily-theme", date))() * wordThemes.length)];
}

export function wordVariant(size: WordSize, theme?: string): string {
  return (theme ?? "daily") + "-" + size;
}

function placeWords(
  words: Omit<HiddenWord, "cells">[], size: WordSize, random: Random,
): { grid: string[]; placed: HiddenWord[] } | null {
  const grid = Array<string>(size * size).fill("");
  const placed: HiddenWord[] = [];
  const directions = size === 10 ? easyDirections : allDirections;

  for (const word of words) {
    let best: { cells: number[]; weight: number } | undefined;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        for (const [dr, dc] of directions) {
          const endRow = row + (word.letters.length - 1) * dr;
          const endCol = col + (word.letters.length - 1) * dc;
          if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue;

          const cells = Array.from({ length: word.letters.length }, (_, index) => (row + dr * index) * size + col + dc * index);
          if (cells.some((cell, index) => grid[cell] && grid[cell] !== word.letters[index])) continue;

          const overlap = cells.reduce((sum, cell) => sum + Number(grid[cell] !== ""), 0);
          const weight = random() + overlap * 0.36;
          if (!best || weight > best.weight) best = { cells, weight };
        }
      }
    }
    if (!best) return null;
    best.cells.forEach((cell, index) => { grid[cell] = word.letters[index]; });
    placed.push({ ...word, cells: best.cells });
  }
  return { grid, placed };
}

export function createWordSearch(date: string, size: WordSize = 10, themeSlug?: string): WordPuzzle {
  const theme = findWordTheme(themeSlug) ?? dailyTheme(date);
  const random = mulberry32(getDailySeed("word-search:" + theme.slug + ":" + size, date));
  const eligible = theme.words.map((text) => ({ text, letters: text.replace(/[^A-Z]/g, "") }))
    .filter((word) => word.letters.length <= size);
  const words = shuffle(eligible, random).slice(0, size === 10 ? 8 : 10)
    .sort((first, second) => second.letters.length - first.letters.length);

  let layout: ReturnType<typeof placeWords> = null;
  for (let attempt = 0; attempt < 8 && !layout; attempt++) layout = placeWords(words, size, random);
  if (!layout) {
    const rows = shuffle(Array.from({ length: size }, (_, index) => index), random);
    const grid = Array<string>(size * size).fill("");
    const placed = words.map((word, index) => {
      const start = rows[index] * size + Math.floor(random() * (size - word.letters.length + 1));
      const cells = [...word.letters].map((letter, offset) => {
        grid[start + offset] = letter;
        return start + offset;
      });
      return { ...word, cells };
    });
    layout = { grid, placed };
  }

  return {
    theme, size,
    grid: layout.grid.map((letter) => letter || alphabet[Math.floor(random() * alphabet.length)]),
    words: layout.placed.sort((first, second) => first.text.localeCompare(second.text, "en-US")),
  };
}

export function cellsBetween(first: number, last: number, size: WordSize): number[] {
  if (first < 0 || last < 0 || first >= size * size || last >= size * size) return [];
  const row = Math.floor(first / size);
  const col = first % size;
  const rows = Math.floor(last / size) - row;
  const cols = last % size - col;
  if (rows !== 0 && cols !== 0 && Math.abs(rows) !== Math.abs(cols)) return [];
  return Array.from({ length: Math.max(Math.abs(rows), Math.abs(cols)) + 1 }, (_, index) =>
    (row + Math.sign(rows) * index) * size + col + Math.sign(cols) * index,
  );
}

export function findSelectedWord(puzzle: WordPuzzle, cells: number[]): HiddenWord | undefined {
  const letters = cells.map((cell) => puzzle.grid[cell]).join("");
  const reversed = [...letters].reverse().join("");
  return puzzle.words.find((word) => word.letters === letters || word.letters === reversed);
}
