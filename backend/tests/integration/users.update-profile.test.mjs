import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const profileUrl = "http://localhost:3000/api/v1/users/me";
const testEmail = `user02-${Date.now()}@example.com`;
const originalPasswordHash = "must-not-change";

try {
  const noTokenResponse = await fetch(profileUrl, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullName: "Updated User" })
  });
  assert.equal(noTokenResponse.status, 401);

  const user = await prisma.user.create({
    data: {
      fullName: "USER-02 Test User",
      email: testEmail,
      passwordHash: originalPasswordHash
    }
  });
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const authorization = `Bearer ${accessToken}`;

  const forbiddenResponse = await fetch(profileUrl, {
    method: "PATCH",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify({
      role: "ADMIN",
      status: "BLOCKED",
      password: "NewPassword123"
    })
  });
  const forbiddenBody = await forbiddenResponse.json();

  assert.equal(forbiddenResponse.status, 400);
  assert.ok(forbiddenBody.errors.role);
  assert.ok(forbiddenBody.errors.status);
  assert.ok(forbiddenBody.errors.password);

  const updateResponse = await fetch(`${profileUrl}?userId=ignored`, {
    method: "PATCH",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify({
      fullName: "Trần Minh Duy Updated",
      avatarUrl: "https://example.com/avatar.jpg"
    })
  });
  const updateBody = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updateBody.success, true);
  assert.equal(updateBody.message, "Profile updated successfully");
  assert.equal(updateBody.data.id, user.id);
  assert.equal(updateBody.data.fullName, "Trần Minh Duy Updated");
  assert.equal(updateBody.data.avatarUrl, "https://example.com/avatar.jpg");
  assert.equal(updateBody.data.role, "STUDENT");
  assert.equal(updateBody.data.status, "ACTIVE");
  assert.equal("passwordHash" in updateBody.data, false);

  const storedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(storedUser.passwordHash, originalPasswordHash);
  assert.equal(storedUser.role, "STUDENT");
  assert.equal(storedUser.status, "ACTIVE");

  console.log("Update profile integration tests passed");
} finally {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
}
