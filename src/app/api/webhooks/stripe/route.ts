import type Stripe from "stripe";
import { getStripe, paymentsReady, reconcileBilling } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 45;

const subscriptionEvents = new Set<Stripe.Event.Type>([
  "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
  "customer.subscription.paused", "customer.subscription.resumed",
]);

export async function POST(request: Request) {
  if (!paymentsReady()) return new Response("Billing unavailable", { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    let customer: string | Stripe.Customer | Stripe.DeletedCustomer | null = null;
    if (event.type === "checkout.session.completed" && event.data.object.mode === "subscription") {
      customer = event.data.object.customer;
    } else if (subscriptionEvents.has(event.type)) {
      customer = (event.data.object as Stripe.Subscription).customer;
    }
    if (customer) await reconcileBilling(typeof customer === "string" ? customer : customer.id);
    return Response.json({ received: true });
  } catch (error) {
    console.error("[stripe webhook]", event.id, error instanceof Error ? error.message : "Failed");
    return new Response("Billing update will be retried", { status: 500 });
  }
}
