import { siteUrl } from "@/lib/catalog";
import { isPlan } from "@/lib/clubPlans";
import { getViewer } from "@/lib/viewer";
import { isSiteForm, paymentsReady, startCheckout } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: Request) {
  if (!isSiteForm(request)) return new Response("Invalid request origin", { status: 403 });
  const { user } = await getViewer();
  if (!user) return Response.redirect(siteUrl("/account?next=club"), 303);
  if (!paymentsReady()) return Response.redirect(siteUrl("/club?checkout=unavailable"), 303);

  try {
    const plan = (await request.formData()).get("plan");
    if (!isPlan(plan)) return new Response("Choose an available plan.", { status: 400 });
    return Response.redirect(await startCheckout(user.id, plan), 303);
  } catch (error) {
    console.error("[checkout]", error instanceof Error ? error.message : "Failed");
    return Response.redirect(siteUrl("/club?checkout=unavailable"), 303);
  }
}
