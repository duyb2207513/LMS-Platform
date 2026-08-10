import { unlink } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { LESSON_FILE_DIRECTORY } from "../../config/upload.js";
import type { CreateSectionInput, UpdateSectionInput } from "./sections.types.js";
import { createSection, deleteSection, listManagedSections, updateSection } from "./sections.service.js";

const param = (request: Request, key: string) => String(request.params[key] ?? "");
export async function listSectionsController(request: Request, response: Response) { sendSuccess(response, 200, "Sections retrieved successfully", await listManagedSections(param(request, "courseId"), request.auth)); }
export async function createSectionController(request: Request, response: Response) { sendSuccess(response, 201, "Section created successfully", await createSection(param(request, "courseId"), request.auth, request.body as CreateSectionInput)); }
export async function updateSectionController(request: Request, response: Response) { sendSuccess(response, 200, "Section updated successfully", await updateSection(param(request, "sectionId"), request.auth, request.body as UpdateSectionInput)); }
export async function deleteSectionController(request: Request, response: Response) {
  const urls = await deleteSection(param(request, "sectionId"), request.auth);
  await Promise.all(urls.map(url => unlink(path.join(LESSON_FILE_DIRECTORY, path.basename(url))).catch(() => undefined)));
  response.status(204).send();
}
