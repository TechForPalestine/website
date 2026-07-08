import { constantTimeEqual } from "./crypto";
import { getEnv } from "./getEnv";

const REALM = "Admin";

export function isAuthorized(request: Request, locals: unknown): boolean {
  const expectedUser = getEnv("ADMIN_USERNAME", locals);
  const expectedPassword = getEnv("ADMIN_PASSWORD", locals);
  if (!expectedUser || !expectedPassword) return false;

  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return false;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  return (
    constantTimeEqual(user, expectedUser) &&
    constantTimeEqual(password, expectedPassword)
  );
}

export function unauthorizedResponse(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}
