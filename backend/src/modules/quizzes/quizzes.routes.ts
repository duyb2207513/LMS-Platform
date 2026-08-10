import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { createOptionController, createQuestionController, createQuizController, deleteOptionController, deleteQuestionController, deleteQuizController, getQuizController, listMyAttemptsController, startAttemptController, submitAttemptController, updateOptionController, updateQuestionController, updateQuizController } from "./quizzes.controller.js";
import { validateCreateOptionInput, validateCreateQuestionInput, validateCreateQuizInput, validateSubmitAttemptInput, validateUpdateOptionInput, validateUpdateQuestionInput, validateUpdateQuizInput } from "./quizzes.validation.js";

const manage = [authenticate, authorize("INSTRUCTOR", "ADMIN")] as const;
export const lessonQuizzesRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /lessons/{lessonId}/quizzes:
 *   post:
 *     summary: Create a quiz for a lesson
 *     tags: [Quizzes]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: lessonId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CreateQuizRequest' } } } }
 *     responses: { 201: { description: Quiz created successfully }, 403: { description: Course ownership required }, 409: { description: Lesson already has a quiz } }
 */
lessonQuizzesRouter.post("/", ...manage, validateRequest(validateCreateQuizInput), asyncHandler(createQuizController));

export const quizzesRouter = Router();
/**
 * @openapi
 * /quizzes/{quizId}:
 *   get:
 *     summary: Get quiz (correct answers hidden from students)
 *     tags: [Quizzes]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: quizId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Quiz retrieved successfully }, 403: { description: Enrollment required }, 404: { description: Quiz not found } }
 *   patch:
 *     summary: Update or publish a quiz
 *     tags: [Quizzes]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: quizId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateQuizRequest' } } } }
 *     responses: { 200: { description: Quiz updated successfully }, 400: { description: Quiz is not ready to publish }, 409: { description: Quiz already has attempts } }
 *   delete:
 *     summary: Delete a quiz
 *     tags: [Quizzes]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: quizId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Quiz deleted successfully }, 409: { description: Quiz already has attempts } }
 * /quizzes/{quizId}/questions:
 *   post:
 *     summary: Add a question to a quiz
 *     tags: [Quiz questions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: quizId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CreateQuestionRequest' } } } }
 *     responses: { 201: { description: Question created successfully }, 409: { description: Quiz already has attempts } }
 * /quizzes/{quizId}/attempts:
 *   post:
 *     summary: Start a quiz attempt
 *     tags: [Quiz attempts]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: quizId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 201: { description: Quiz attempt started }, 403: { description: Enrollment required }, 409: { description: Attempt limit reached or active attempt exists } }
 * /quizzes/{quizId}/attempts/me:
 *   get:
 *     summary: List current student's attempts
 *     tags: [Quiz attempts]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: quizId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Quiz attempts retrieved successfully } }
 */
quizzesRouter.get("/:quizId", authenticate, asyncHandler(getQuizController));
quizzesRouter.patch("/:quizId", ...manage, validateRequest(validateUpdateQuizInput), asyncHandler(updateQuizController));
quizzesRouter.delete("/:quizId", ...manage, asyncHandler(deleteQuizController));
quizzesRouter.post("/:quizId/questions", ...manage, validateRequest(validateCreateQuestionInput), asyncHandler(createQuestionController));
quizzesRouter.post("/:quizId/attempts", authenticate, authorize("STUDENT"), asyncHandler(startAttemptController));
quizzesRouter.get("/:quizId/attempts/me", authenticate, authorize("STUDENT"), asyncHandler(listMyAttemptsController));

export const questionsRouter = Router();
/**
 * @openapi
 * /questions/{questionId}:
 *   patch:
 *     summary: Update a quiz question
 *     tags: [Quiz questions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: questionId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateQuestionRequest' } } } }
 *     responses: { 200: { description: Question updated successfully } }
 *   delete:
 *     summary: Delete a quiz question
 *     tags: [Quiz questions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: questionId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Question deleted successfully } }
 * /questions/{questionId}/options:
 *   post:
 *     summary: Add an option to a question
 *     tags: [Quiz options]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: questionId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CreateQuizOptionRequest' } } } }
 *     responses: { 201: { description: Option created successfully } }
 */
questionsRouter.patch("/:questionId", ...manage, validateRequest(validateUpdateQuestionInput), asyncHandler(updateQuestionController));
questionsRouter.delete("/:questionId", ...manage, asyncHandler(deleteQuestionController));
questionsRouter.post("/:questionId/options", ...manage, validateRequest(validateCreateOptionInput), asyncHandler(createOptionController));

export const optionsRouter = Router();
/**
 * @openapi
 * /options/{optionId}:
 *   patch:
 *     summary: Update a quiz option
 *     tags: [Quiz options]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: optionId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/UpdateQuizOptionRequest' } } } }
 *     responses: { 200: { description: Option updated successfully } }
 *   delete:
 *     summary: Delete a quiz option
 *     tags: [Quiz options]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: optionId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Option deleted successfully } }
 */
optionsRouter.patch("/:optionId", ...manage, validateRequest(validateUpdateOptionInput), asyncHandler(updateOptionController));
optionsRouter.delete("/:optionId", ...manage, asyncHandler(deleteOptionController));

export const quizAttemptsRouter = Router();
/**
 * @openapi
 * /quiz-attempts/{attemptId}/submit:
 *   post:
 *     summary: Submit and grade a quiz attempt
 *     tags: [Quiz attempts]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: attemptId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/SubmitQuizAttemptRequest' } } } }
 *     responses: { 200: { description: Quiz graded successfully }, 400: { description: Invalid answer references }, 409: { description: Attempt already submitted } }
 */
quizAttemptsRouter.post("/:attemptId/submit", authenticate, authorize("STUDENT"), validateRequest(validateSubmitAttemptInput), asyncHandler(submitAttemptController));
