import assert from "node:assert/strict";

const response = await fetch("http://localhost:3000/api/v1/auth/logout", {
  method: "POST",
  headers: { cookie: "refreshToken=token-to-clear" }
});
const body = await response.json();
const setCookie = response.headers.get("set-cookie");

assert.equal(response.status, 200);
assert.deepEqual(body, {
  success: true,
  message: "Logout successful",
  data: null
});
assert.match(setCookie ?? "", /^refreshToken=;/);
assert.match(setCookie ?? "", /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i);
assert.match(setCookie ?? "", /Path=\/api\/v1\/auth/i);
assert.match(setCookie ?? "", /HttpOnly/i);
assert.match(setCookie ?? "", /Secure/i);
assert.match(setCookie ?? "", /SameSite=Lax/i);

console.log("Logout integration tests passed");
