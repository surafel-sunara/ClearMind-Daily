import { adClient } from "@/lib/ads";

export function GET() {
  const seller = process.env.ADSENSE_SELLER_ID || adClient.replace(/^ca-/, "");
  if (!/^pub-\d{16}$/.test(seller)) return new Response("Ads are not configured.\n", { status: 404 });
  return new Response("google.com, " + seller + ", DIRECT, f08c47fec0942fa0\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
