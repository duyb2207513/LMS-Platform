import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/lms_db";
process.env.JWT_ACCESS_SECRET = "test-access-secret";

const { verifyAccessToken } = await import("../../dist/modules/auth/auth.tokens.js");

const payload = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  role: "STUDENT"
};
const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });

assert.deepEqual(verifyAccessToken(token), payload);
assert.throws(() => verifyAccessToken("invalid-token"));

const expiredToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: -1 });
assert.throws(() => verifyAccessToken(expiredToken));

console.log("Access token tests passed");
