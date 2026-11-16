import Link from "next/link";
import { BadgeCheck, CircleUserRound, Files, Gamepad2, Leaf, Sparkles } from "lucide-react";
import { AccessibilityBar } from "./AccessibilityBar";

export function Brand({ footer = false }: { footer?: boolean }) {
  return <Link href="/" className={"brand" + (footer ? " brand-footer" : "")} aria-label="ClearMind Daily home">
    <span className="brand-mark" aria-hidden="true">
      <Leaf strokeWidth={2.1} />
    </span>
    <span>ClearMind <span className="brand-daily">Daily</span></span>
  </Link>;
}

export function SiteHeader({ signedIn, isPro }: { signedIn: boolean; isPro: boolean }) {
  return <header className="site-header">
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="frame top-nav">
      <Brand />
      <nav aria-label="Main navigation" className="main-nav">
        <Link href="/#games"><Gamepad2 aria-hidden="true" /> Games</Link>
        <Link href="/printables"><Files aria-hidden="true" /> Printables</Link>
        <Link href="/club">{isPro ? <BadgeCheck aria-hidden="true" /> : <Sparkles aria-hidden="true" />} Ad-Free Club</Link>
      </nav>
      <Link className="button button-outline account-link" href="/account">
        <CircleUserRound aria-hidden="true" />{signedIn ? "My Account" : "Sign In"}
      </Link>
    </div>
    <AccessibilityBar />
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="frame footer-inner">
      <div>
        <Brand footer />
        <p>Free daily puzzles in large print.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/#games">Play games</Link>
        <Link href="/printables">Printables</Link>
        <Link href="/club">Ad-Free Club</Link>
        <Link href="/privacy">Privacy</Link>
        {process.env.SUPPORT_EMAIL && <a href={"mailto:" + process.env.SUPPORT_EMAIL}>Support</a>}
      </nav>
    </div>
  </footer>;
}
