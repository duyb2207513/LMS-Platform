import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../dist/config/database.js";

const authUrl = "http://localhost:3000/api/v1/auth";
const email = `sprint6-${Date.now()}@example.com`;
const password = "Password123";
const nextPassword = "NewPassword456";
const githubEmail = `github-${email}`;
const json = { "content-type": "application/json" };

const cookieFrom = response => response.headers.get("set-cookie")?.match(/refreshToken=([^;]+)/)?.[1];

try {
  const user = await prisma.user.create({
    data: { fullName: "Sprint Six User", email, passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: new Date() }
  });

  const loginResponse = await fetch(`${authUrl}/login`, { method: "POST", headers: json, body: JSON.stringify({ email, password }) });
  assert.equal(loginResponse.status, 200);
  const loginBody = await loginResponse.json();
  const firstRefreshToken = cookieFrom(loginResponse);
  assert.ok(firstRefreshToken);
  assert.ok(loginBody.data.accessToken);
  assert.equal(await prisma.authSession.count({ where: { userId: user.id, revokedAt: null } }), 1);

  const sessionsResponse = await fetch(`${authUrl}/sessions`, { headers: { authorization: `Bearer ${loginBody.data.accessToken}` } });
  assert.equal(sessionsResponse.status, 200);
  const sessions = (await sessionsResponse.json()).data;
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0].isCurrent, true);

  const refreshResponse = await fetch(`${authUrl}/refresh-token`, { method: "POST", headers: { cookie: `refreshToken=${firstRefreshToken}` } });
  assert.equal(refreshResponse.status, 200);
  const rotatedRefreshToken = cookieFrom(refreshResponse);
  assert.ok(rotatedRefreshToken);
  assert.notEqual(rotatedRefreshToken, firstRefreshToken);
  assert.equal((await fetch(`${authUrl}/refresh-token`, { method: "POST", headers: { cookie: `refreshToken=${firstRefreshToken}` } })).status, 401);

  const resetToken = "a".repeat(64);
  await prisma.authToken.create({
    data: { userId: user.id, type: "RESET_PASSWORD", tokenHash: createHash("sha256").update(resetToken).digest("hex"), expiresAt: new Date(Date.now() + 60_000) }
  });
  const resetResponse = await fetch(`${authUrl}/reset-password`, { method: "POST", headers: json, body: JSON.stringify({ token: resetToken, newPassword: nextPassword, confirmNewPassword: nextPassword }) });
  assert.equal(resetResponse.status, 200);
  assert.equal(await prisma.authSession.count({ where: { userId: user.id, revokedAt: null } }), 0);
  assert.equal((await fetch(`${authUrl}/login`, { method: "POST", headers: json, body: JSON.stringify({ email, password: nextPassword }) })).status, 200);

  const verifyUser = await prisma.user.create({ data: { fullName: "Verify User", email: `verify-${email}`, passwordHash: await bcrypt.hash(password, 12) } });
  const verifyToken = "b".repeat(64);
  await prisma.authToken.create({ data: { userId: verifyUser.id, type: "VERIFY_EMAIL", tokenHash: createHash("sha256").update(verifyToken).digest("hex"), expiresAt: new Date(Date.now() + 60_000) } });
  assert.equal((await fetch(`${authUrl}/verify-email`, { method: "POST", headers: json, body: JSON.stringify({ token: verifyToken }) })).status, 200);
  assert.ok((await prisma.user.findUnique({ where: { id: verifyUser.id }, select: { emailVerifiedAt: true } }))?.emailVerifiedAt);

  assert.equal((await fetch(`${authUrl}/forgot-password`, { method: "POST", headers: json, body: JSON.stringify({ email: `missing-${email}` }) })).status, 200);
  assert.ok(await prisma.auditLog.count({ where: { actorUserId: user.id } }));

  const runtimeEnv = (await import("../../dist/config/env.js")).env;
  const previousGitHubConfig = [runtimeEnv.githubClientId, runtimeEnv.githubClientSecret, runtimeEnv.githubCallbackUrl];
  const originalFetch = globalThis.fetch;
  try {
    runtimeEnv.githubClientId = "integration-client-id";
    runtimeEnv.githubClientSecret = "integration-client-secret";
    runtimeEnv.githubCallbackUrl = `${authUrl}/github/callback`;
    globalThis.fetch = async (url, options) => {
      const target = String(url);
      if (target === "https://github.com/login/oauth/access_token") {
        assert.match(String(options?.body), /client_secret=integration-client-secret/);
        return Response.json({ access_token: "github-provider-token" });
      }
      if (target === "https://api.github.com/user") {
        return Response.json({ id: 987654321, login: "sprint-six", name: "Sprint Six GitHub", avatar_url: "https://avatars.githubusercontent.com/u/987654321" });
      }
      if (target === "https://api.github.com/user/emails") {
        return Response.json([{ email: githubEmail, primary: true, verified: true }]);
      }
      return originalFetch(url, options);
    };
    const { githubLogin } = await import("../../dist/modules/auth/auth.service.js");
    const githubResult = await githubLogin("valid-code");
    assert.ok(githubResult.accessToken);
    assert.equal(githubResult.user.email, githubEmail);
    assert.equal(githubResult.user.role, "STUDENT");
    assert.equal((await prisma.user.findUnique({ where: { email: githubEmail }, select: { githubId: true } }))?.githubId, "987654321");
    assert.equal(await prisma.authSession.count({ where: { userId: githubResult.user.id, revokedAt: null } }), 1);
  } finally {
    globalThis.fetch = originalFetch;
    runtimeEnv.githubClientId = previousGitHubConfig[0];
    runtimeEnv.githubClientSecret = previousGitHubConfig[1];
    runtimeEnv.githubCallbackUrl = previousGitHubConfig[2];
  }

  console.log("Sprint 6 authentication and security integration tests passed");
} finally {
  await prisma.user.deleteMany({ where: { email: { in: [email, `verify-${email}`, githubEmail] } } });
  await prisma.$disconnect();
}
