import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const authUrl = "http://localhost:3000/api/v1/auth";
const testEmail = `auth-session-${Date.now()}@example.com`;
const password = "Password123";

try {
  const user = await prisma.user.create({
    data: {
      fullName: "Auth Session Test User",
      email: testEmail,
      passwordHash: await bcrypt.hash(password, 12)
    }
  });

  const unknownEmailResponse = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `unknown-${testEmail}`, password })
  });
  const wrongPasswordResponse = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: "WrongPassword123" })
  });
  assert.equal(unknownEmailResponse.status, 401);
  assert.equal(wrongPasswordResponse.status, 401);
  assert.equal(
    (await unknownEmailResponse.json()).message,
    (await wrongPasswordResponse.json()).message
  );

  const loginResponse = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: testEmail, password })
  });
  const loginBody = await loginResponse.json();
  const setCookie = loginResponse.headers.get("set-cookie") ?? "";
  const refreshToken = setCookie.match(/refreshToken=([^;]+)/)?.[1];

  assert.equal(loginResponse.status, 200);
  assert.equal(loginBody.message, "Login successful");
  assert.equal(loginBody.data.user.id, user.id);
  assert.equal(loginBody.data.user.role, "STUDENT");
  assert.equal("passwordHash" in loginBody.data.user, false);
  assert.ok(loginBody.data.accessToken);
  assert.ok(refreshToken);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=Lax/i);

  const accessPayload = jwt.verify(loginBody.data.accessToken, process.env.JWT_ACCESS_SECRET);
  assert.equal(accessPayload.userId, user.id);
  assert.equal(accessPayload.role, "STUDENT");

  assert.equal((await fetch(`${authUrl}/refresh-token`, { method: "POST" })).status, 401);
  assert.equal(
    (
      await fetch(`${authUrl}/refresh-token`, {
        method: "POST",
        headers: { cookie: "refreshToken=invalid-token" }
      })
    ).status,
    401
  );

  const refreshResponse = await fetch(`${authUrl}/refresh-token`, {
    method: "POST",
    headers: { cookie: `refreshToken=${refreshToken}` }
  });
  const refreshBody = await refreshResponse.json();
  assert.equal(refreshResponse.status, 200);
  assert.equal(refreshBody.message, "Token refreshed successfully");
  assert.ok(refreshBody.data.accessToken);

  const logoutResponse = await fetch(`${authUrl}/logout`, {
    method: "POST",
    headers: { cookie: `refreshToken=${refreshToken}` }
  });
  assert.equal(logoutResponse.status, 200);
  assert.deepEqual(await logoutResponse.json(), {
    success: true,
    message: "Logout successful",
    data: null
  });
  assert.match(logoutResponse.headers.get("set-cookie") ?? "", /^refreshToken=;/);

  await prisma.user.update({ where: { id: user.id }, data: { status: "BLOCKED" } });
  const blockedLoginResponse = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: testEmail, password })
  });
  assert.equal(blockedLoginResponse.status, 403);

  console.log("Authentication session integration tests passed");
} finally {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
}
