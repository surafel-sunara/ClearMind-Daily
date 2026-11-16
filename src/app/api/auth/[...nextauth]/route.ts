import { emailProviderId, handlers } from "@/lib/auth";

export const runtime = "nodejs";

function disabled() {
  return Response.json({ error: "Email sign-in is unavailable." }, { status: 503 });
}

export const GET = emailProviderId ? handlers.GET : disabled;
export const POST = emailProviderId ? handlers.POST : disabled;
