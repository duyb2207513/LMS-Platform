import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const profileUrl = "http://localhost:3000/api/v1/users/me";
const testEmail = `user01-${Date.now()}@example.com`;

try {
  const noTokenResponse = await fetch(profileUrl);
  assert.equal(noTokenResponse.status, 401);

  const invalidTokenResponse = await fetch(profileUrl, {
    headers: { authorization: "Bearer invalid-token" }
  });
  assert.equal(invalidTokenResponse.status, 401);

  const user = await prisma.user.create({
    data: {
      fullName: "USER-01 Test User",
      email: testEmail,
      passwordHash: "not-used-by-profile"
    }
  });
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const profileResponse = await fetch(`${profileUrl}?userId=ignored`, {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  const profileBody = await profileResponse.json();

  assert.equal(profileResponse.status, 200);
  assert.equal(profileBody.success, true);
  assert.equal(profileBody.message, "Profile retrieved successfully");
  assert.equal(profileBody.data.id, user.id);
  assert.equal(profileBody.data.email, testEmail);
  assert.equal("passwordHash" in profileBody.data, false);

  console.log("User profile integration tests passed");
} finally {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
}
