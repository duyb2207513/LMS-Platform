import assert from "node:assert/strict";
import { prisma } from "../../dist/config/database.js";

const apiBaseUrl = "http://localhost:3000/api/v1/auth";
const testEmail = `auth03-${Date.now()}@example.com`;

try {
  const missingCookieResponse = await fetch(`${apiBaseUrl}/refresh-token`, {
    method: "POST"
  });
  assert.equal(missingCookieResponse.status, 401);

  const invalidTokenResponse = await fetch(`${apiBaseUrl}/refresh-token`, {
    method: "POST",
    headers: { cookie: "refreshToken=invalid-token" }
  });
  assert.equal(invalidTokenResponse.status, 401);

  const registerResponse = await fetch(`${apiBaseUrl}/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fullName: "AUTH-03 Test User",
      email: testEmail,
      password: "Password123",
      confirmPassword: "Password123"
    })
  });
  assert.equal(registerResponse.status, 201);

  const loginResponse = await fetch(`${apiBaseUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: "Password123" })
  });
  assert.equal(loginResponse.status, 200);

  const setCookie = loginResponse.headers.get("set-cookie");
  const refreshToken = setCookie?.match(/refreshToken=([^;]+)/)?.[1];
  assert.ok(refreshToken);

  const refreshResponse = await fetch(`${apiBaseUrl}/refresh-token`, {
    method: "POST",
    headers: { cookie: `refreshToken=${refreshToken}` }
  });
  const refreshBody = await refreshResponse.json();

  assert.equal(refreshResponse.status, 200);
  assert.equal(refreshBody.success, true);
  assert.equal(refreshBody.message, "Token refreshed successfully");
  assert.ok(refreshBody.data.accessToken);

  console.log("Refresh token integration tests passed");
} finally {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
}
