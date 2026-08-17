/** Akedly V1.2 (Shield) — server-side helpers. Keys stay in env, never exposed to the client. */

const AKEDLY_API_BASE = "https://api.akedly.io/api/v1.2";

export type AkedlyChallenge = {
  challenge: string;
  difficulty: number;
  challengeToken: string;
  challengeRequired: boolean;
  turnstile?: {
    required?: boolean;
    siteKey?: string;
  };
};

export type AkedlySendResult = {
  transactionReqID: string;
  transactionID?: string;
  channels: string[];
  expiresAt?: string;
};

export type AkedlyVerifyResult = {
  verified: boolean;
  transactionID?: string;
};

export function isAkedlyConfigured(): boolean {
  return Boolean(process.env.AKEDLY_API_KEY && process.env.AKEDLY_PIPELINE_ID);
}

function getCredentials() {
  const APIKey = process.env.AKEDLY_API_KEY;
  const pipelineID = process.env.AKEDLY_PIPELINE_ID;
  if (!APIKey || !pipelineID) {
    throw new Error("akedly_not_configured");
  }
  return { APIKey, pipelineID };
}

function unwrapData<T>(body: Record<string, unknown>): T {
  if (body.data && typeof body.data === "object") {
    return body.data as T;
  }
  return body as T;
}

function akedlyErrorMessage(body: Record<string, unknown>, fallback: string): string {
  const message = body.message;
  if (typeof message === "string" && message.trim()) return message;
  const code = body.code;
  if (typeof code === "string" && code.trim()) return code;
  return fallback;
}

export async function fetchAkedlyChallenge(): Promise<AkedlyChallenge> {
  const { APIKey, pipelineID } = getCredentials();
  const url =
    `${AKEDLY_API_BASE}/transactions/challenge` +
    `?APIKey=${encodeURIComponent(APIKey)}` +
    `&pipelineID=${encodeURIComponent(pipelineID)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok || body.status === "error") {
    throw new Error(akedlyErrorMessage(body, `Akedly challenge failed (${res.status})`));
  }

  return unwrapData<AkedlyChallenge>(body);
}

export async function sendAkedlyOtp(input: {
  phoneNumber: string;
  powSolution: { challengeToken: string; nonce: number };
  turnstileToken?: string;
  clientIp?: string;
}): Promise<AkedlySendResult> {
  const { APIKey, pipelineID } = getCredentials();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (input.clientIp) headers["x-end-user-ip"] = input.clientIp;

  const res = await fetch(`${AKEDLY_API_BASE}/transactions/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      APIKey,
      pipelineID,
      verificationAddress: { phoneNumber: input.phoneNumber },
      powSolution: input.powSolution,
      turnstileToken: input.turnstileToken,
      digits: 6,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok || body.status === "error") {
    throw new Error(akedlyErrorMessage(body, `Akedly send failed (${res.status})`));
  }

  const data = unwrapData<{
    transactionReqID?: string;
    transactionID?: string;
    channels?: string[];
    expiresAt?: string;
  }>(body);

  if (!data.transactionReqID) {
    throw new Error("Akedly did not return a transaction request ID");
  }

  return {
    transactionReqID: data.transactionReqID,
    transactionID: data.transactionID,
    channels: data.channels ?? [],
    expiresAt: data.expiresAt,
  };
}

export async function verifyAkedlyOtp(input: {
  transactionReqID: string;
  otp: string;
}): Promise<AkedlyVerifyResult> {
  const res = await fetch(`${AKEDLY_API_BASE}/transactions/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactionReqID: input.transactionReqID,
      otp: input.otp,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok || body.status === "error") {
    throw new Error(akedlyErrorMessage(body, `Akedly verify failed (${res.status})`));
  }

  const data = unwrapData<{ verified?: boolean; transactionID?: string }>(body);
  return {
    verified: data.verified === true,
    transactionID: data.transactionID,
  };
}

/** Best-effort client IP for Akedly per-user rate limiting. */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || undefined;
}
