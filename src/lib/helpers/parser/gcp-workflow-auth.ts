import { createSign } from "node:crypto";

function getDirectAccessToken(): string | null {
  return process.env.GCP_WORKFLOW_ACCESS_TOKEN || null;
}

function getServiceAccountEmail(): string | null {
  return process.env.GCP_SERVICE_ACCOUNT_EMAIL || null;
}

function getServiceAccountPrivateKey(): string | null {
  const value = process.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY;
  return value ? value.replace(/\\n/g, "\n") : null;
}

function getUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

function encodeSegment(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function createSignedJwt(unsignedToken: string, privateKey: string): string {
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  return `${unsignedToken}.${signer.sign(privateKey, "base64url")}`;
}

function buildServiceAccountAssertion(email: string, privateKey: string): string {
  const issuedAt = getUnixTimestamp();
  const header = encodeSegment(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeSegment(JSON.stringify({
    iss: email,
    sub: email,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/cloud-platform",
    iat: issuedAt,
    exp: issuedAt + 3600,
  }));

  return createSignedJwt(`${header}.${payload}`, privateKey);
}

async function requestServiceAccountAccessToken(email: string, privateKey: string): Promise<string> {
  const assertion = buildServiceAccountAssertion(email, privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange GCP service account token: ${response.status}`);
  }

  const payload = await response.json() as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("Missing GCP access token in token exchange response");
  }

  return payload.access_token;
}

async function requestMetadataAccessToken(): Promise<string> {
  const response = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
    headers: {
      "Metadata-Flavor": "Google",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GCP metadata token: ${response.status}`);
  }

  const payload = await response.json() as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("Missing GCP access token in metadata response");
  }

  return payload.access_token;
}

export async function getGcpWorkflowAccessToken(): Promise<string> {
  const directAccessToken = getDirectAccessToken();

  if (directAccessToken) {
    return directAccessToken;
  }

  const serviceAccountEmail = getServiceAccountEmail();
  const serviceAccountPrivateKey = getServiceAccountPrivateKey();

  if (serviceAccountEmail && serviceAccountPrivateKey) {
    return requestServiceAccountAccessToken(serviceAccountEmail, serviceAccountPrivateKey);
  }

  return requestMetadataAccessToken();
}
