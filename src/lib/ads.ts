export const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";
export const adSlots = {
  leaderboard: process.env.NEXT_PUBLIC_ADSENSE_LEADERBOARD_SLOT ?? "",
  rectangle: process.env.NEXT_PUBLIC_ADSENSE_RECTANGLE_SLOT ?? "",
};

export function isAdClientConfigured() {
  return /^ca-pub-\d{16}$/.test(adClient) && Object.values(adSlots).some((slot) => /^\d+$/.test(slot));
}
