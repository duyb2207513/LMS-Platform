import assert from "node:assert/strict";
import {
  validateChangePasswordInput,
  validateUpdateProfileInput
} from "../../dist/modules/users/users.validation.js";

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

const validPasswordChange = validateChangePasswordInput({
  currentPassword: "Password123",
  newPassword: "NewPassword456",
  confirmNewPassword: "NewPassword456"
});

assert.equal(validPasswordChange.errors, undefined);

assert.ok(
  validateChangePasswordInput({
    currentPassword: "Password123",
    newPassword: "weak",
    confirmNewPassword: "different"
  }).errors?.newPassword
);

const samePassword = validateChangePasswordInput({
  currentPassword: "Password123",
  newPassword: "Password123",
  confirmNewPassword: "Password123"
});
assert.ok(samePassword.errors?.newPassword);

const mismatchedConfirmation = validateChangePasswordInput({
  currentPassword: "Password123",
  newPassword: "NewPassword456",
  confirmNewPassword: "Different789"
});
assert.ok(mismatchedConfirmation.errors?.confirmNewPassword);

console.log("Users validation tests passed");
