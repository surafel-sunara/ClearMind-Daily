import { siteUrl } from "@/lib/catalog";
import { getViewer } from "@/lib/viewer";
import { billingPortal, isSiteForm, paymentsReady } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSiteForm(request)) return new Response("Invalid request origin", { status: 403 });
  const { user } = await getViewer();
  if (!user) return Response.redirect(siteUrl("/account"), 303);
  if (!user.stripeCustomerId || !paymentsReady()) return Response.redirect(siteUrl("/account?billing=unavailable"), 303);
  try {
    return Response.redirect(await billingPortal(user.stripeCustomerId), 303);
  } catch (error) {
    console.error("[billing portal]", error instanceof Error ? error.message : "Failed");
    return Response.redirect(siteUrl("/account?billing=unavailable"), 303);
  }
}
