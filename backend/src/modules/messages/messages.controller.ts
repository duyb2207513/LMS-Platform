import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { listConversations, listMessages, searchContacts, sendMessage } from "./messages.service.js";
import type { SendMessageInput } from "./messages.types.js";

const param = (request: Request, key: string) => String(request.params[key] ?? "");
export async function contactsController(request: Request, response: Response) { sendSuccess(response, 200, "Contacts retrieved successfully", await searchContacts(request.auth.userId, request.query.search)); }
export async function conversationsController(request: Request, response: Response) { sendSuccess(response, 200, "Conversations retrieved successfully", await listConversations(request.auth.userId)); }
export async function messagesController(request: Request, response: Response) { sendSuccess(response, 200, "Messages retrieved successfully", await listMessages(request.auth.userId, param(request, "userId"))); }
export async function sendController(request: Request, response: Response) { sendSuccess(response, 201, "Message sent successfully", await sendMessage(request.auth.userId, param(request, "userId"), request.body as SendMessageInput)); }
