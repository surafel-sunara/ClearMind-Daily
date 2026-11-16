import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  const contact = process.env.SUPPORT_EMAIL;
  return <article className="narrow-page page legal-copy">
    <header className="page-intro"><h1>Privacy</h1><p>How ClearMind Daily stores and uses information when you play.</p></header>
    <section>
      <h2>Playing and Saved Progress</h2>
      <p>Your text size, contrast, sound, unfinished boards, and local game results are stored in your browser. Clearing the website’s browser data removes that device’s saved information.</p>
    </section>
    <section>
      <h2>Signing In and Syncing Scores</h2>
      <p>When you sign in, we store your email address and keep you signed in with a session cookie. The configured email provider delivers a temporary sign-in link. A limited sign-in history helps prevent repeated unwanted emails. Turning on Score Sync stores completed scores and activity dates with your account.</p>
    </section>
    <section>
      <h2>Club Membership and Billing</h2>
      <p>Stripe processes membership payments and manages billing details. We store the Stripe customer and subscription identifiers, selected plan, membership status, and billing period. Card information goes directly to Stripe. <a className="text-link" href="https://stripe.com/privacy">Stripe Privacy Policy</a></p>
    </section>
    <section>
      <h2>Advertising</h2>
      <p>When ads are enabled, Google AdSense can serve ads on free puzzle pages. Google and its partners may use cookies or device identifiers for ads, subject to your choices and settings. <a className="text-link" href="https://policies.google.com/technologies/partner-sites">How Google uses information from sites and apps</a></p>
    </section>
    {contact && <section><h2>Contact</h2><p><a className="text-link" href={"mailto:" + contact}>{contact}</a></p></section>}
  </article>;
}
