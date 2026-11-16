import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Cloud, CreditCard, Gamepad2, LogOut, MailCheck, Sparkles } from "lucide-react";
import { StreakCard } from "@/components/StreakCard";
import { queryValue } from "@/lib/catalog";
import { isPlan, plans } from "@/lib/clubPlans";
import { emailProviderId } from "@/lib/auth";
import { dateLabel, utcDate } from "@/lib/seed";
import { paymentsReady } from "@/lib/stripe";
import { getViewer } from "@/lib/viewer";
import { leaveAccount, setScoreSync } from "./actions";
import { EmailForm } from "./EmailForm";
import { MembershipRefresh } from "./MembershipRefresh";

export const metadata: Metadata = { title: "My Account", robots: { index: false, follow: false } };

export default async function Account({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const { user, isPro } = await getViewer();
  const sent = queryValue(query.type) === "email" && queryValue(query.provider) === emailProviderId;
  const pendingCheckout = queryValue(query.checkout) === "complete" && !isPro && Boolean(user);

  return <div className="narrow-page page">
    <header className="page-intro">
      <h1>{user ? "My Account" : "Sign In"}</h1>
      <p>{user ? user.email : "Enter your email and we’ll send a link that signs you in."}</p>
    </header>
    {queryValue(query.billing) === "unavailable" &&
      <p className="notice" role="status">The billing portal couldn’t open. Please try again in a moment.</p>}
    {!user && queryValue(query.error) && <p className="notice" role="alert">That sign-in link couldn’t be used. Request a fresh link below.</p>}
    {!user && sent && <div className="account-card sent-card" role="status">
      <MailCheck aria-hidden="true" />
      <div><h2>Check your inbox</h2><p>Open the email from ClearMind Daily and choose the sign-in link within 15 minutes. Look in your junk folder if it hasn’t arrived.</p></div>
    </div>}
    {user ? <>
      <section className="account-card">
        <h2><BadgeCheck aria-hidden="true" /> Ad-Free Club</h2>
        {isPro ? <p>
          {isPlan(user.subscriptionPlan) ? plans[user.subscriptionPlan].label + " membership" : "Club membership"} is active.
          {user.currentPeriodEnd && " Your current billing period ends " + dateLabel(utcDate(user.currentPeriodEnd)) + "."}
        </p> : pendingCheckout ? <p role="status">We’re waiting for Stripe to confirm your membership. You can check again below.</p>
          : <p>Join for ad-free play, instant hints, past puzzles, and large-print PDF packs.</p>}
        <div className="controls">
          {pendingCheckout && <MembershipRefresh />}
          {user.stripeCustomerId && paymentsReady() && <form action="/api/portal" method="post">
            <button type="submit" className="button button-primary"><CreditCard aria-hidden="true" /> Manage Billing</button>
          </form>}
          {!isPro && !pendingCheckout && <Link href="/club" className="button button-outline"><Sparkles aria-hidden="true" /> View Club Plans</Link>}
        </div>
      </section>
      <section className="account-card">
        <h2><Cloud aria-hidden="true" /> Score Sync</h2>
        <p>{user.syncScores ? "Score sync is on. Your completed scores and streaks can follow this account."
          : "Score sync is off. Turn it on to see your completed scores and streaks on other devices."}</p>
        <p>Unfinished puzzles are stored in your browser.</p>
        <form action={setScoreSync}>
          <input type="hidden" name="sync" value={user.syncScores ? "off" : "on"} />
          <button className="button button-outline" type="submit"><Cloud aria-hidden="true" /> Turn Sync {user.syncScores ? "Off" : "On"}</button>
        </form>
      </section>
      <StreakCard today={utcDate()} full />
      <form className="account-signout" action={leaveAccount}>
        <button type="submit" className="button button-outline"><LogOut aria-hidden="true" /> Sign Out</button>
      </form>
    </> : <section className="account-card">
      {emailProviderId ? <EmailForm next={queryValue(query.next)} />
        : <p>Email sign-in is currently unavailable. Today’s games are ready to play.</p>}
      <Link href="/#games" className="button button-outline play-guest"><Gamepad2 aria-hidden="true" /> Play as a Guest</Link>
    </section>}
  </div>;
}
