import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.types.js";

const ALLOWED_FIELDS = new Set(["name", "description"]);

function validateDescription(
  value: unknown,
  errors: Record<string, string>
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    errors.description = "Description must be a string or null";
    return undefined;
  }

  return value.trim() || null;
}

function rejectUnsupportedFields(
  input: Record<string, unknown>,
  errors: Record<string, string>
): void {
  for (const field of Object.keys(input)) {
    if (!ALLOWED_FIELDS.has(field)) {
      errors[field] = `${field} is not allowed`;
    }
  }
}

export function validateCreateCategoryInput(
  body: unknown
): RequestValidationResult<CreateCategoryInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Request body must be a JSON object" } };
  }

  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  rejectUnsupportedFields(input, errors);

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = validateDescription(input.description, errors);

  if (!name) {
    errors.name = "Name is required";
  } else if (name.length > 100) {
    errors.name = "Name must not exceed 100 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { data: { name, ...(description === undefined ? {} : { description }) } };
}

export function validateUpdateCategoryInput(
  body: unknown
): RequestValidationResult<UpdateCategoryInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: { body: "Request body must be a JSON object" } };
  }

  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: UpdateCategoryInput = {};
  rejectUnsupportedFields(input, errors);

  if (Object.prototype.hasOwnProperty.call(input, "name")) {
    const name = typeof input.name === "string" ? input.name.trim() : "";

    if (!name) {
      errors.name = "Name is required";
    } else if (name.length > 100) {
      errors.name = "Name must not exceed 100 characters";
    } else {
      data.name = name;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    const description = validateDescription(input.description, errors);
    if (description !== undefined) {
      data.description = description;
    }
  }

  if (Object.keys(input).length === 0) {
    errors.body = "At least one category field is required";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { data };
}
