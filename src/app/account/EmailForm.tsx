"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { requestEmailLink } from "./actions";

export function EmailForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(requestEmailLink, { error: "" });
  return <form action={action} className="email-form">
    <label htmlFor="email">Email address</label>
    <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email"
      spellCheck={false} inputMode="email" maxLength={254} required aria-describedby={state.error ? "email-error" : undefined} />
    {next === "club" && <input type="hidden" name="next" value="club" />}
    {state.error && <p id="email-error" className="notice" role="alert">{state.error}</p>}
    <button type="submit" className="button button-primary" disabled={pending}>
      <Mail aria-hidden="true" /> {pending ? "Sending link…" : "Email Me a Sign-In Link"}
    </button>
  </form>;
}
