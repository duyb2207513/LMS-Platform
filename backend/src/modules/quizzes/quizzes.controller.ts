import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import type { OptionInput, QuestionInput, QuizInput, SubmitAttemptInput, UpdateOptionInput, UpdateQuestionInput, UpdateQuizInput } from "./quizzes.types.js";
import { createOption, createQuestion, createQuiz, deleteOption, deleteQuestion, deleteQuiz, getQuiz, listMyAttempts, startAttempt, submitAttempt, updateOption, updateQuestion, updateQuiz } from "./quizzes.service.js";
const p = (request: Request, key: string) => String(request.params[key] ?? "");
export async function createQuizController(request: Request, response: Response) { sendSuccess(response, 201, "Quiz created successfully", await createQuiz(p(request, "lessonId"), request.auth, request.body as QuizInput)); }
export async function getQuizController(request: Request, response: Response) { sendSuccess(response, 200, "Quiz retrieved successfully", await getQuiz(p(request, "quizId"), request.auth)); }
export async function updateQuizController(request: Request, response: Response) { sendSuccess(response, 200, "Quiz updated successfully", await updateQuiz(p(request, "quizId"), request.auth, request.body as UpdateQuizInput)); }
export async function deleteQuizController(request: Request, response: Response) { await deleteQuiz(p(request, "quizId"), request.auth); response.status(204).send(); }
export async function createQuestionController(request: Request, response: Response) { sendSuccess(response, 201, "Question created successfully", await createQuestion(p(request, "quizId"), request.auth, request.body as QuestionInput)); }
export async function updateQuestionController(request: Request, response: Response) { sendSuccess(response, 200, "Question updated successfully", await updateQuestion(p(request, "questionId"), request.auth, request.body as UpdateQuestionInput)); }
export async function deleteQuestionController(request: Request, response: Response) { await deleteQuestion(p(request, "questionId"), request.auth); response.status(204).send(); }
export async function createOptionController(request: Request, response: Response) { sendSuccess(response, 201, "Option created successfully", await createOption(p(request, "questionId"), request.auth, request.body as OptionInput)); }
export async function updateOptionController(request: Request, response: Response) { sendSuccess(response, 200, "Option updated successfully", await updateOption(p(request, "optionId"), request.auth, request.body as UpdateOptionInput)); }
export async function deleteOptionController(request: Request, response: Response) { await deleteOption(p(request, "optionId"), request.auth); response.status(204).send(); }
export async function startAttemptController(request: Request, response: Response) { sendSuccess(response, 201, "Quiz attempt started successfully", await startAttempt(p(request, "quizId"), request.auth.userId)); }
export async function listMyAttemptsController(request: Request, response: Response) { sendSuccess(response, 200, "Quiz attempts retrieved successfully", await listMyAttempts(p(request, "quizId"), request.auth.userId)); }
export async function submitAttemptController(request: Request, response: Response) { sendSuccess(response, 200, "Quiz submitted successfully", await submitAttempt(p(request, "attemptId"), request.auth.userId, request.body as SubmitAttemptInput)); }
