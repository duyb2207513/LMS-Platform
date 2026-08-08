import assert from "node:assert/strict";
import {
  validateLoginInput,
  validateRegisterInput
} from "../../dist/modules/auth/auth.validation.js";

const validInput = {
  fullName: "Trần Minh Duy",
  email: "duy@example.com",
  password: "Password123",
  confirmPassword: "Password123"
};

const normalized = validateRegisterInput({
  ...validInput,
  fullName: "  Trần Minh Duy  ",
  email: "  DUY@EXAMPLE.COM  "
});

assert.equal(normalized.errors, undefined);
assert.equal(normalized.data?.fullName, "Trần Minh Duy");
assert.equal(normalized.data?.email, "duy@example.com");

const invalid = validateRegisterInput({
  fullName: "A",
  email: "invalid",
  password: "password",
  confirmPassword: "different"
});

assert.ok(invalid.errors?.fullName);
assert.ok(invalid.errors?.email);
assert.ok(invalid.errors?.password);
assert.ok(invalid.errors?.confirmPassword);

const withRole = validateRegisterInput({ ...validInput, role: "ADMIN" });

assert.equal(withRole.errors?.role, "Role cannot be set during registration");

const normalizedLogin = validateLoginInput({
  email: "  DUY@EXAMPLE.COM ",
  password: "Password123"
});
assert.equal(normalizedLogin.errors, undefined);
assert.equal(normalizedLogin.data?.email, "duy@example.com");

const missingLoginFields = validateLoginInput({ email: "", password: "" });
assert.equal(missingLoginFields.errors?.email, "Email is required");
assert.equal(missingLoginFields.errors?.password, "Password is required");

console.log("Authentication validation tests passed");
