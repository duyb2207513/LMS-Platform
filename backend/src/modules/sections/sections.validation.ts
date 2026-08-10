import type { RequestValidationResult } from "../../common/middlewares/validateRequest.js";
import type { CreateSectionInput, UpdateSectionInput } from "./sections.types.js";

const FIELDS = new Set(["title", "position"]);

function validate(body: unknown, partial: boolean): RequestValidationResult<CreateSectionInput | UpdateSectionInput> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { body: "Request body must be a JSON object" } };
  const input = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: UpdateSectionInput = {};
  for (const key of Object.keys(input)) if (!FIELDS.has(key)) errors[key] = `${key} cannot be set through this endpoint`;

  if (!partial || Object.hasOwn(input, "title")) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title) errors.title = "Title is required";
    else if (title.length > 255) errors.title = "Title must not exceed 255 characters";
    else data.title = title;
  }
  if (Object.hasOwn(input, "position")) {
    if (!Number.isInteger(input.position) || Number(input.position) < 1) errors.position = "Position must be a positive integer";
    else data.position = Number(input.position);
  }
  if (partial && Object.keys(input).length === 0) errors.body = "At least one section field is required";
  if (Object.keys(errors).length) return { errors };
  return { data: data as CreateSectionInput | UpdateSectionInput };
}

export const validateCreateSectionInput = (body: unknown) => validate(body, false) as RequestValidationResult<CreateSectionInput>;
export const validateUpdateSectionInput = (body: unknown) => validate(body, true) as RequestValidationResult<UpdateSectionInput>;
