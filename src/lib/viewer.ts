import { cache } from "react";
import { auth, emailProviderId } from "./auth";
import { prisma } from "./prisma";

export function hasClubAccess(user: { subscriptionStatus: string; currentPeriodEnd: Date | null }, now = new Date()) {
  return (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing")
    && user.currentPeriodEnd !== null && user.currentPeriodEnd > now;
}

export const getViewer = cache(async () => {
  if (!emailProviderId) return { user: null, isPro: false } as const;
  const session = await auth();
  if (!session?.user?.id) return { user: null, isPro: false } as const;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, stripeCustomerId: true, subscriptionStatus: true,
      subscriptionPlan: true, currentPeriodEnd: true, syncScores: true,
    },
  });
  return { user, isPro: Boolean(user && hasClubAccess(user)) };
});
