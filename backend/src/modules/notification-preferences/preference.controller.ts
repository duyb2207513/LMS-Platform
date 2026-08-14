import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { getPreferences, updatePreferences } from "./preference.service.js";
import type { NotificationPreferenceInput } from "./preference.types.js";
export async function getPreferencesController(request: Request, response: Response) { sendSuccess(response, 200, "Notification preferences retrieved successfully", await getPreferences(request.auth.userId)); }
export async function updatePreferencesController(request: Request, response: Response) { sendSuccess(response, 200, "Notification preferences updated successfully", await updatePreferences(request.auth.userId, request.body as NotificationPreferenceInput)); }
