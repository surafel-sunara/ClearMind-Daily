"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { signIn, signOut, emailProviderId, validEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";

export async function requestEmailLink(_previous: { error: string }, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!validEmail(email)) return { error: "Enter a complete email address, such as name@example.com." };
  if (!emailProviderId) return { error: "Email sign-in is unavailable right now." };

  try {
    await signIn(emailProviderId, { email, redirectTo: form.get("next") === "club" ? "/club" : "/account" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "We couldn’t send a sign-in link. Check your address or try again in a few minutes." };
    throw error;
  }
  return { error: "" };
}

export async function leaveAccount() {
  if (emailProviderId) await signOut({ redirectTo: "/account" });
}

export async function setScoreSync(form: FormData) {
  const { user } = await getViewer();
  if (!user) return;
  await prisma.user.update({ where: { id: user.id }, data: { syncScores: form.get("sync") === "on" } });
  revalidatePath("/", "layout");
}
