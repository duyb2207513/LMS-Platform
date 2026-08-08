import assert from "node:assert/strict";
import { validateUpdateProfileInput } from "../../dist/modules/users/users.validation.js";

const valid = validateUpdateProfileInput({
  fullName: "  Trần Minh Duy Updated  ",
  avatarUrl: "https://example.com/avatar.jpg"
});

assert.equal(valid.errors, undefined);
assert.deepEqual(valid.data, {
  fullName: "Trần Minh Duy Updated",
  avatarUrl: "https://example.com/avatar.jpg"
});

assert.ok(validateUpdateProfileInput({}).errors?.body);
assert.ok(validateUpdateProfileInput({ fullName: "A" }).errors?.fullName);
assert.ok(validateUpdateProfileInput({ avatarUrl: "not-a-url" }).errors?.avatarUrl);

const forbidden = validateUpdateProfileInput({
  role: "ADMIN",
  status: "BLOCKED",
  password: "NewPassword123"
});

assert.ok(forbidden.errors?.role);
assert.ok(forbidden.errors?.status);
assert.ok(forbidden.errors?.password);

console.log("Update profile validation tests passed");
