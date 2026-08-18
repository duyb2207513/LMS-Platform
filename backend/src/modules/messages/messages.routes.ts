import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { contactsController, conversationsController, messagesController, sendController } from "./messages.controller.js";
import { validateSendMessageInput } from "./messages.validation.js";

const messagesRouter = Router();
messagesRouter.use(authenticate);
/**
 * @openapi
 * /messages/contacts:
 *   get:
 *     summary: Search active LMS users available for direct messaging
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: query, name: search, schema: { type: string, maxLength: 100 } }]
 *     responses: { 200: { description: Contacts retrieved } }
 * /messages/conversations:
 *   get:
 *     summary: List the current user's direct conversations
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Conversations retrieved } }
 * /messages/{userId}:
 *   get:
 *     summary: Get message history with another user and mark incoming messages read
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Messages retrieved }, 404: { description: User not found } }
 *   post:
 *     summary: Send a direct message to another active user
 *     tags: [Messages]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [content], properties: { content: { type: string, maxLength: 5000 } } } } } }
 *     responses: { 201: { description: Message sent }, 404: { description: User not found } }
 */
messagesRouter.get("/contacts", asyncHandler(contactsController));
messagesRouter.get("/conversations", asyncHandler(conversationsController));
messagesRouter.get("/:userId", asyncHandler(messagesController));
messagesRouter.post("/:userId", validateRequest(validateSendMessageInput), asyncHandler(sendController));
export default messagesRouter;
