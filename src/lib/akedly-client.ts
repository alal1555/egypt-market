/** Akedly V1.2 client flow — calls our API proxy, uses Shield SDK for PoW + Turnstile. */

import { getTurnstileToken, solvePow } from "@akedly/shield";
import { normalizeEgyptPhone } from "@/lib/wallet";

export type AkedlyChallengeResponse = {
  challenge: string;
  difficulty: number;
  challengeToken: string;
  challengeRequired: boolean;
  turnstile?: {
    required?: boolean;
    siteKey?: string;
  };
};

export type AkedlySendResponse = {
  transactionReqID: string;
  channels: string[];
  expiresAt?: string;
};

async function authFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(30_000),
  });
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

function errorFromBody(body: Record<string, unknown>, status: number): string {
  const message = body.error ?? body.message;
  if (typeof message === "string" && message.trim()) return message;
  return `Request failed (${status})`;
}

export async function fetchAkedlyChallengeProxy(): Promise<AkedlyChallengeResponse> {
  const res = await fetch("/api/auth/akedly/challenge", {
    signal: AbortSignal.timeout(15_000),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(errorFromBody(body, res.status));
  return body as AkedlyChallengeResponse;
}

/** Full send flow: challenge → PoW/Turnstile → send OTP (WhatsApp preferred). */
export async function sendAkedlyOtpViaProxy(
  accessToken: string,
  phoneInput: string,
): Promise<AkedlySendResponse> {
  const phoneNumber = normalizeEgyptPhone(phoneInput);
  const challenge = await fetchAkedlyChallengeProxy();

  let powSolution: { challengeToken: string; nonce: number } | undefined;
  if (challenge.challengeRequired !== false) {
    const { nonce } = await solvePow(challenge.challenge, challenge.difficulty);
    powSolution = { challengeToken: challenge.challengeToken, nonce };
  } else {
    powSolution = { challengeToken: challenge.challengeToken, nonce: 0 };
  }

  let turnstileToken: string | undefined;
  if (challenge.turnstile?.required && challenge.turnstile.siteKey) {
    turnstileToken = await getTurnstileToken(challenge.turnstile.siteKey);
  }

  const res = await authFetch(accessToken, "/api/auth/akedly/send", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, powSolution, turnstileToken }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(errorFromBody(body, res.status));

  const transactionReqID = body.transactionReqID;
  if (typeof transactionReqID !== "string") {
    throw new Error("Invalid response from verification service");
  }

  return {
    transactionReqID,
    channels: Array.isArray(body.channels) ? (body.channels as string[]) : [],
    expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : undefined,
  };
}

export async function verifyAkedlyOtpViaProxy(
  accessToken: string,
  transactionReqID: string,
  otp: string,
): Promise<{ verified: boolean }> {
  const res = await authFetch(accessToken, "/api/auth/akedly/verify", {
    method: "POST",
    body: JSON.stringify({ transactionReqID, otp }),
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(errorFromBody(body, res.status));
  return { verified: body.verified === true };
}

/** Human-readable delivery channel for UI (WhatsApp, SMS, etc.). */
export function formatAkedlyChannels(channels: string[]): string {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    sms: "SMS",
    email: "Email",
  };
  const unique = [...new Set(channels.map((c) => labels[c.toLowerCase()] ?? c))];
  if (unique.length === 0) return "WhatsApp or SMS";
  return unique.join(" / ");
}
