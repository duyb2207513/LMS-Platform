import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { prisma } from "../../dist/config/database.js";

const avatarUrl = "http://localhost:3000/api/v1/users/me/avatar";
const testEmail = `avatar-${Date.now()}@example.com`;

try {
  assert.equal((await fetch(avatarUrl, { method: "POST" })).status, 401);

  const user = await prisma.user.create({
    data: { fullName: "Avatar Test User", email: testEmail, passwordHash: "not-used" }
  });
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const authorization = `Bearer ${accessToken}`;

  const invalidForm = new FormData();
  invalidForm.append("avatar", new Blob(["not-an-image"], { type: "image/png" }), "invalid.png");
  const invalidResponse = await fetch(avatarUrl, {
    method: "POST",
    headers: { authorization },
    body: invalidForm
  });
  assert.equal(invalidResponse.status, 400);

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZPkkAAAAASUVORK5CYII=",
    "base64"
  );
  const uploadForm = new FormData();
  uploadForm.append("avatar", new Blob([png], { type: "image/png" }), "avatar.png");
  const uploadResponse = await fetch(avatarUrl, {
    method: "POST",
    headers: { authorization },
    body: uploadForm
  });
  const uploadBody = await uploadResponse.json();
  assert.equal(uploadResponse.status, 200);
  assert.equal(uploadBody.success, true);
  assert.match(uploadBody.data.avatarUrl, /\/uploads\/avatars\/.+\.png$/);
  assert.equal("passwordHash" in uploadBody.data, false);
  assert.equal((await fetch(uploadBody.data.avatarUrl)).status, 200);

  const deleteResponse = await fetch(avatarUrl, {
    method: "DELETE",
    headers: { authorization }
  });
  const deleteBody = await deleteResponse.json();
  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteBody.data.avatarUrl, null);
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).avatarUrl, null);

  console.log("Avatar upload integration tests passed");
} finally {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
}
