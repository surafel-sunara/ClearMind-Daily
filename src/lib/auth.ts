import { createHmac } from "node:crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers";
import { SMTPClient } from "emailjs";
import Resend from "next-auth/providers/resend";
import { prisma } from "./prisma";
import { siteUrl } from "./catalog";

const { AUTH_SECRET, AUTH_EMAIL_FROM, AUTH_RESEND_KEY, AUTH_SMTP_URL, DATABASE_URL } = process.env;

export function validEmail(email: string): boolean {
  return email.length <= 254
    && /^[a-z0-9.!#$%&'*+/=?^_{}|~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z0-9]{2,}$/i.test(email)
    && !email.includes("..");
}

async function countRequest(scope: string, value: string, limit: number): Promise<boolean> {
  const key = createHmac("sha256", AUTH_SECRET!).update(scope + ":" + value).digest("hex");
  const now = new Date();
  const end = new Date(now.getTime() + 15 * 60 * 1000);
  const rows = await prisma.$queryRaw<{ hits: number }[]>`
    INSERT INTO "SignInLimit" ("key", "windowEnds", "hits")
    VALUES (${key}, ${end}, 1)
    ON CONFLICT ("key") DO UPDATE
      SET "hits" = CASE WHEN "SignInLimit"."windowEnds" <= ${now} THEN 1 ELSE "SignInLimit"."hits" + 1 END,
          "windowEnds" = CASE WHEN "SignInLimit"."windowEnds" <= ${now} THEN ${end} ELSE "SignInLimit"."windowEnds" END
      WHERE "SignInLimit"."windowEnds" <= ${now} OR "SignInLimit"."hits" < ${limit}
    RETURNING "hits"
  `;
  return rows.length > 0;
}

function getEmailProvider(): EmailConfig | undefined {
  if (!DATABASE_URL || !AUTH_SECRET || !AUTH_EMAIL_FROM || (!AUTH_RESEND_KEY && !AUTH_SMTP_URL)) return;
  const options = {
    from: AUTH_EMAIL_FROM,
    maxAge: 15 * 60,
    normalizeIdentifier(identifier: string) {
      const email = identifier.trim().toLowerCase();
      if (!validEmail(email)) throw new Error("Invalid email address");
      return email;
    },
  };
  const provider: EmailConfig = AUTH_RESEND_KEY ? Resend({ ...options, apiKey: AUTH_RESEND_KEY }) : {
    ...options,
    id: "smtp",
    type: "email",
    name: "Email",
    async sendVerificationRequest({ identifier, url }) {
      const smtpUrl = new URL(AUTH_SMTP_URL!);
      const secure = smtpUrl.protocol === "smtps:";
      if (!secure && smtpUrl.protocol !== "smtp:") throw new Error("Invalid SMTP protocol");
      const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(smtpUrl.hostname);
      const client = new SMTPClient({
        host: smtpUrl.hostname.replace(/^\[|\]$/g, ""),
        port: smtpUrl.port ? Number(smtpUrl.port) : secure ? 465 : 587,
        user: smtpUrl.username ? decodeURIComponent(smtpUrl.username) : undefined,
        password: smtpUrl.password ? decodeURIComponent(smtpUrl.password) : undefined,
        ssl: secure,
        tls: !secure && !loopback,
        timeout: 8000,
      });
      try {
        await client.sendAsync({
          from: options.from,
          to: identifier,
          subject: "Your ClearMind Daily sign-in link",
          text: ["Sign in to ClearMind Daily", "", url, "", "This link expires in 15 minutes. If you didn’t request it, you can ignore this email."].join("\n"),
        });
      } finally {
        client.smtp.close();
      }
    },
  };
  const send = provider.sendVerificationRequest;

  return {
    ...provider,
    async sendVerificationRequest(params) {
      const address = params.request.headers.get("x-vercel-forwarded-for")
        ?.split(",")[0]?.trim();
      if (process.env.VERCEL && address && !await countRequest("address", address, 20)) {
        throw new Error("Too many sign-in attempts");
      }
      if (!await countRequest("email", params.identifier, 3)) throw new Error("Too many sign-in attempts");
      await send(params);
    },
  };
}

const provider = getEmailProvider();
export const emailProviderId = provider?.id;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(provider ? { adapter: PrismaAdapter(prisma) } : {}),
  providers: provider ? [provider] : [],
  trustHost: Boolean(process.env.AUTH_URL || process.env.VERCEL) || process.env.NODE_ENV !== "production",
  session: { strategy: provider ? "database" : "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/account",
    verifyRequest: "/account",
    error: "/account",
  },
  callbacks: {
    redirect({ url }) {
      const origin = siteUrl().origin;
      try {
        const target = new URL(url, origin);
        if (target.origin === origin) return target.href;
      } catch {
        // Malformed callback URLs fall back to the local account page.
      }
      return new URL("/account", origin).href;
    },
    session({ session, user }) {
      if (session.user && user) session.user.id = user.id;
      return session;
    },
  },
  logger: {
    error(error) { console.error("[email sign-in]", "type" in error ? error.type : error.name); },
  },
});
