import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/lms_db";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} = await import("../../dist/modules/auth/auth.tokens.js");

const payload = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  role: "STUDENT"
};
const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });

assert.deepEqual(verifyAccessToken(token), payload);
assert.throws(() => verifyAccessToken("invalid-token"));

const expiredToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: -1 });
assert.throws(() => verifyAccessToken(expiredToken));

const createdAccessToken = createAccessToken(payload);
const accessPayload = jwt.verify(createdAccessToken, process.env.JWT_ACCESS_SECRET);
assert.equal(accessPayload.userId, payload.userId);
assert.equal(accessPayload.role, payload.role);
assert.equal(accessPayload.exp - accessPayload.iat, ACCESS_TOKEN_EXPIRES_IN_SECONDS);

const createdRefreshToken = createRefreshToken(payload);
const refreshPayload = jwt.verify(createdRefreshToken, process.env.JWT_REFRESH_SECRET);
assert.deepEqual(verifyRefreshToken(createdRefreshToken), payload);
assert.equal(refreshPayload.tokenType, "refresh");
assert.equal(refreshPayload.exp - refreshPayload.iat, REFRESH_TOKEN_EXPIRES_IN_SECONDS);
assert.throws(() => verifyRefreshToken("invalid-token"));

console.log("Authentication token tests passed");
