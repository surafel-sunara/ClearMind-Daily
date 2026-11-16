import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays, Check, CircleUserRound, Lightbulb, Printer, Sparkles } from "lucide-react";
import { emailProviderId } from "@/lib/auth";
import { queryValue } from "@/lib/catalog";
import { displayPrice, plans, type Plan } from "@/lib/clubPlans";
import { paymentsReady } from "@/lib/stripe";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Ad-Free Club",
  description: "Enjoy ad-free puzzles, instant hints, a seven-day archive and large-print PDF packs.",
  alternates: { canonical: "/club" },
};

const perks = [
  { icon: BadgeCheck, title: "Ad-free play", description: "Enjoy all four games without display ads." },
  { icon: Lightbulb, title: "Instant hints", description: "Get a hint right away as often as you need one." },
  { icon: CalendarDays, title: "Seven days of past puzzles", description: "Catch up on any daily puzzle from the previous seven days." },
  { icon: Printer, title: "Large-print PDFs", description: "Print Word Search and Sudoku together with an answer key." },
];

export default async function Club({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, isPro } = await getViewer();
  const query = queryValue((await searchParams).checkout);
  const billable = paymentsReady() && Boolean(emailProviderId);
  return <div className="frame page">
    <section className="club-heading">
      <div className="page-intro">
        <span className="club-mark"><Sparkles aria-hidden="true" /></span>
        <h1>Ad-Free Club</h1>
        <p>More puzzles, instant hints, and large-print packs to take away.</p>
      </div>
      <ul className="perk-list">{perks.map(({ icon: Icon, title, description }) => <li key={title}>
        <Icon aria-hidden="true" /><div><strong>{title}</strong><p>{description}</p></div>
      </li>)}</ul>
    </section>
    {!billable && !isPro && <p className="notice" role="status">Club sign-ups are currently unavailable. You can play all four of today’s games for free.</p>}
    {query === "canceled" && <p className="notice" role="status">Checkout was canceled. Choose a plan when you’re ready.</p>}
    {query === "unavailable" && billable && <p className="notice" role="status">Checkout couldn’t open. Please try again in a moment.</p>}
    {isPro ? <section className="account-card active-club">
      <h2><BadgeCheck aria-hidden="true" /> You’re a Club Member</h2>
      <div className="controls">
        <Link href="/printables" className="button button-primary"><Printer aria-hidden="true" /> Get Printable Puzzles</Link>
        <Link href="/account" className="button button-outline"><CircleUserRound aria-hidden="true" /> My Account</Link>
      </div>
    </section> : <section className="pricing-area" aria-labelledby="plans-title">
      <h2 id="plans-title">Choose Your Plan</h2>
      <div className="plan-grid">
        {(["monthly", "annual"] as const).map((plan: Plan) => <article className={"plan-card " + (plan === "annual" ? "annual-plan" : "")} key={plan}>
          <div className="plan-title"><h3>{plans[plan].label}</h3>{plan === "annual" && <span className="savings"><Check aria-hidden="true" /> Best Value · Save 51%</span>}</div>
          <p className="price"><strong>{displayPrice(plan)}</strong><span> / {plans[plan].interval}</span></p>
          <p>USD, billed {plan === "monthly" ? "each month" : "once a year"}.</p>
          {!billable ? <button type="button" className="button button-outline" disabled><Sparkles aria-hidden="true" /> Choose {plans[plan].label}</button>
            : user ? <form action="/api/checkout" method="post">
              <input type="hidden" name="plan" value={plan} />
              <button type="submit" className="button button-primary">Choose {plans[plan].label} <ArrowRight aria-hidden="true" /></button>
            </form> : <Link href="/account?next=club" className="button button-primary">
              <CircleUserRound aria-hidden="true" /> Sign In to Join
            </Link>}
        </article>)}
      </div>
      <p className="pricing-note">Plans renew automatically. You can manage or cancel your plan in My Account.</p>
    </section>}
  </div>;
}
