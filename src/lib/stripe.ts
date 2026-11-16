import "server-only";
import Stripe from "stripe";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { plans, type Plan } from "./clubPlans";
import { siteUrl } from "./catalog";

export function paymentsReady() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
    && process.env.STRIPE_PRICE_MONTHLY_ID && process.env.STRIPE_PRICE_ANNUAL_ID
    && process.env.STRIPE_PRICE_MONTHLY_ID !== process.env.STRIPE_PRICE_ANNUAL_ID);
}

let stripe: Stripe | undefined;
export function getStripe(): Stripe {
  if (!paymentsReady()) throw new Error("Billing is disabled");
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!, { timeout: 5000, maxNetworkRetries: 1, appInfo: { name: "ClearMind Daily" } });
  return stripe;
}

function priceId(plan: Plan) {
  return plan === "monthly" ? process.env.STRIPE_PRICE_MONTHLY_ID! : process.env.STRIPE_PRICE_ANNUAL_ID!;
}

export function isSiteForm(request: Request) {
  return request.headers.get("origin") === siteUrl().origin
    && request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded");
}

function lockBilling<T>(userId: string, work: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    return work(tx);
  }, { maxWait: 5000, timeout: 35_000 });
}

const ongoing = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

async function clubSubscription(stripe: Stripe, customer: string) {
  let latest: { subscription: Stripe.Subscription; plan: Plan; item: Stripe.SubscriptionItem } | undefined;
  let billing: typeof latest;
  for await (const subscription of stripe.subscriptions.list({ customer, status: "all", limit: 100 })) {
    const item = subscription.items.data.find((entry) => entry.price.id === priceId("monthly") || entry.price.id === priceId("annual"));
    if (!item) continue;
    const plan = item.price.id === priceId("monthly") ? "monthly" : "annual";
    const match = { subscription, plan, item } as const;
    latest ??= match;
    if ((subscription.status === "active" || subscription.status === "trialing")
        && !subscription.pause_collection && item.current_period_end * 1000 > Date.now()) return match;
    if (ongoing.has(subscription.status)) billing ??= match;
  }
  return billing ?? latest;
}

export async function billingPortal(customer: string) {
  const portal = await getStripe().billingPortal.sessions.create({
    customer,
    return_url: siteUrl("/account").href,
  });
  return portal.url;
}

export async function startCheckout(userId: string, plan: Plan): Promise<string> {
  const stripe = getStripe();
  const price = await stripe.prices.retrieve(priceId(plan));
  const expected = plans[plan];
  if (!price.active || price.currency !== "usd" || price.unit_amount !== expected.amount
      || price.recurring?.interval !== expected.interval || price.recurring.interval_count !== 1
      || price.recurring.usage_type !== "licensed") {
    throw new Error("Stripe price does not match the advertised plan");
  }

  // Keep the customer association durable before a Checkout Session can emit events.
  const customer = await lockBilling(userId, async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.emailVerified) throw new Error("Email verification is required");
    if (user.stripeCustomerId) return user.stripeCustomerId;
    const created = await stripe.customers.create({
      email: user.email, metadata: { clearmindUserId: user.id },
    }, { idempotencyKey: "clearmind-customer-" + user.id });
    await tx.user.update({ where: { id: userId }, data: { stripeCustomerId: created.id } });
    return created.id;
  });

  return lockBilling(userId, async () => {
    const current = await clubSubscription(stripe, customer);
    if (current && ongoing.has(current.subscription.status)) return billingPortal(customer);

    for await (const existing of stripe.checkout.sessions.list({ customer, status: "open", limit: 100 })) {
      if (existing.metadata?.clearmindUserId !== userId) continue;
      if (existing.metadata.plan === plan && existing.url) return existing.url;
      await stripe.checkout.sessions.expire(existing.id);
    }

    const checkout = await stripe.checkout.sessions.create({
      customer,
      mode: "subscription",
      line_items: [{ price: priceId(plan), quantity: 1 }],
      client_reference_id: userId,
      metadata: { clearmindUserId: userId, plan },
      subscription_data: { metadata: { clearmindUserId: userId } },
      success_url: siteUrl("/account?checkout=complete").href,
      cancel_url: siteUrl("/club?checkout=canceled").href,
    });
    if (!checkout.url) throw new Error("Stripe did not return a checkout URL");
    return checkout.url;
  });
}

export async function reconcileBilling(customer: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { stripeCustomerId: customer }, select: { id: true } });
  if (!user) return;
  await lockBilling(user.id, async (tx) => {
    const current = await clubSubscription(getStripe(), customer);
    const status = current?.subscription.pause_collection ? "paused" : current?.subscription.status ?? "none";
    await tx.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: current?.subscription.id ?? null,
        subscriptionStatus: status,
        subscriptionPlan: current?.plan ?? null,
        currentPeriodEnd: current ? new Date(current.item.current_period_end * 1000) : null,
      },
    });
  });
}
