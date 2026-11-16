import Link from "next/link";
import { House } from "lucide-react";

export default function NotFound() {
  return <div className="narrow-page page">
    <header className="page-intro"><h1>Page Not Found</h1><p>Return to today’s games to pick a puzzle.</p></header>
    <Link href="/#games" className="button button-primary"><House aria-hidden="true" /> All Games</Link>
  </div>;
}
