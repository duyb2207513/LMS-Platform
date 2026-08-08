import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const passwordUrl = "http://localhost:3000/api/v1/users/me/password";
const testEmail = `user03-${Date.now()}@example.com`;
const currentPassword = "Password123";
const newPassword = "NewPassword456";

try {
  const passwordHash = await bcrypt.hash(currentPassword, 12);
  const user = await prisma.user.create({
    data: {
      fullName: "USER-03 Test User",
      email: testEmail,
      passwordHash
    }
  });
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const headers = {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json"
  };

  const wrongCurrentResponse = await fetch(passwordUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      currentPassword: "WrongPassword123",
      newPassword,
      confirmNewPassword: newPassword
    })
  });
  assert.equal(wrongCurrentResponse.status, 400);

  const changeResponse = await fetch(`${passwordUrl}?userId=ignored`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmNewPassword: newPassword
    })
  });
  const changeBody = await changeResponse.json();

  assert.equal(changeResponse.status, 200);
  assert.deepEqual(changeBody, {
    success: true,
    message: "Password changed successfully",
    data: null
  });

  const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(await bcrypt.compare(newPassword, updatedUser.passwordHash), true);
  assert.equal(await bcrypt.compare(currentPassword, updatedUser.passwordHash), false);
  assert.notEqual(updatedUser.passwordHash, newPassword);

  console.log("Change password integration tests passed");
} finally {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
}
