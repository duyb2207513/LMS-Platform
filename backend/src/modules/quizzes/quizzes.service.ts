import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../config/database.js";
import type { AuthTokenPayload } from "../auth/auth.types.js";
import { assertLessonAccess, canManageCourse, UUID } from "../interactions/access.js";
import { getManagedLesson } from "../lessons/lessons.service.js";
import type { OptionInput, QuestionInput, QuizInput, SubmitAttemptInput, UpdateOptionInput, UpdateQuestionInput, UpdateQuizInput } from "./quizzes.types.js";

const quizTree = { questions: { orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }], include: { options: { orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }] } } } };

async function managedQuiz(quizId: string, actor: AuthTokenPayload) {
  if (!UUID.test(quizId)) throw new AppError(404, "Quiz not found");
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { lesson: { include: { section: { include: { course: { select: { instructorId: true } } } } } } } });
  if (!quiz) throw new AppError(404, "Quiz not found");
  if (!canManageCourse(quiz.lesson.section.course.instructorId, actor)) throw new AppError(403, "You do not have permission to manage this quiz");
  return quiz;
}
async function managedQuestion(questionId: string, actor: AuthTokenPayload) {
  if (!UUID.test(questionId)) throw new AppError(404, "Question not found");
  const question = await prisma.question.findUnique({ where: { id: questionId }, include: { quiz: { include: { lesson: { include: { section: { include: { course: { select: { instructorId: true } } } } } } } } } });
  if (!question) throw new AppError(404, "Question not found");
  if (!canManageCourse(question.quiz.lesson.section.course.instructorId, actor)) throw new AppError(403, "You do not have permission to manage this question");
  return question;
}
async function managedOption(optionId: string, actor: AuthTokenPayload) {
  if (!UUID.test(optionId)) throw new AppError(404, "Option not found");
  const option = await prisma.quizOption.findUnique({ where: { id: optionId }, include: { question: { include: { quiz: { include: { lesson: { include: { section: { include: { course: { select: { instructorId: true } } } } } } } } } } } });
  if (!option) throw new AppError(404, "Option not found");
  if (!canManageCourse(option.question.quiz.lesson.section.course.instructorId, actor)) throw new AppError(403, "You do not have permission to manage this option");
  return option;
}
async function assertMutable(quizId: string) { if (await prisma.quizAttempt.count({ where: { quizId } })) throw new AppError(409, "Quiz cannot be changed after an attempt has started"); }
async function assertReady(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: quizTree });
  if (!quiz?.questions.length) throw new AppError(400, "A published quiz must have at least one question");
  for (const question of quiz.questions) {
    if (question.options.length < 2) throw new AppError(400, "Each published question must have at least two options");
    if (question.options.filter(option => option.isCorrect).length !== 1) throw new AppError(400, "Each published question must have exactly one correct option");
  }
  return quiz;
}

export async function createQuiz(lessonId: string, actor: AuthTokenPayload, input: QuizInput) {
  await getManagedLesson(lessonId, actor);
  if (await prisma.quiz.findUnique({ where: { lessonId } })) throw new AppError(409, "This lesson already has a quiz");
  if (input.isPublished) throw new AppError(400, "Add questions and options before publishing the quiz");
  return prisma.quiz.create({ data: { ...input, lessonId } });
}
export async function getQuiz(quizId: string, actor: AuthTokenPayload) {
  if (!UUID.test(quizId)) throw new AppError(404, "Quiz not found");
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { lesson: { include: { section: { include: { course: { select: { instructorId: true } } } } } }, ...quizTree } });
  if (!quiz) throw new AppError(404, "Quiz not found");
  const manager = canManageCourse(quiz.lesson.section.course.instructorId, actor);
  if (!manager) { await assertLessonAccess(quiz.lessonId, actor); if (!quiz.isPublished) throw new AppError(404, "Published quiz not found"); }
  const { lesson, ...base } = quiz;
  if (manager) return base;
  return { ...base, questions: base.questions.map(({ explanation: _explanation, options, ...question }) => ({ ...question, options: options.map(({ isCorrect: _isCorrect, ...option }) => option) })) };
}
export async function updateQuiz(quizId: string, actor: AuthTokenPayload, input: UpdateQuizInput) {
  await managedQuiz(quizId, actor); await assertMutable(quizId); if (input.isPublished) await assertReady(quizId);
  return prisma.quiz.update({ where: { id: quizId }, data: input, include: quizTree });
}
export async function deleteQuiz(quizId: string, actor: AuthTokenPayload) { await managedQuiz(quizId, actor); await assertMutable(quizId); await prisma.quiz.delete({ where: { id: quizId } }); }

export async function createQuestion(quizId: string, actor: AuthTokenPayload, input: QuestionInput) {
  await managedQuiz(quizId, actor); await assertMutable(quizId);
  const position = input.position ?? ((await prisma.question.aggregate({ where: { quizId }, _max: { position: true } }))._max.position ?? 0) + 1;
  return prisma.question.create({ data: { ...input, quizId, position }, include: { options: true } });
}
export async function updateQuestion(questionId: string, actor: AuthTokenPayload, input: UpdateQuestionInput) { const item = await managedQuestion(questionId, actor); await assertMutable(item.quizId); return prisma.question.update({ where: { id: questionId }, data: input, include: { options: { orderBy: { position: "asc" } } } }); }
export async function deleteQuestion(questionId: string, actor: AuthTokenPayload) { const item = await managedQuestion(questionId, actor); await assertMutable(item.quizId); await prisma.question.delete({ where: { id: questionId } }); }
export async function createOption(questionId: string, actor: AuthTokenPayload, input: OptionInput) {
  const question = await managedQuestion(questionId, actor); await assertMutable(question.quizId);
  const position = input.position ?? ((await prisma.quizOption.aggregate({ where: { questionId }, _max: { position: true } }))._max.position ?? 0) + 1;
  return prisma.quizOption.create({ data: { ...input, questionId, position } });
}
export async function updateOption(optionId: string, actor: AuthTokenPayload, input: UpdateOptionInput) { const option = await managedOption(optionId, actor); await assertMutable(option.question.quizId); return prisma.quizOption.update({ where: { id: optionId }, data: input }); }
export async function deleteOption(optionId: string, actor: AuthTokenPayload) { const option = await managedOption(optionId, actor); await assertMutable(option.question.quizId); await prisma.quizOption.delete({ where: { id: optionId } }); }

export async function startAttempt(quizId: string, studentId: string) {
  if (!UUID.test(quizId)) throw new AppError(404, "Quiz not found");
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { lesson: { include: { section: { select: { courseId: true } } } } } });
  if (!quiz || !quiz.isPublished) throw new AppError(404, "Published quiz not found");
  await assertLessonAccess(quiz.lessonId, { userId: studentId, role: "STUDENT" }); await assertReady(quizId);
  const existing = await prisma.quizAttempt.findFirst({ where: { quizId, studentId, status: "IN_PROGRESS" } });
  if (existing) throw new AppError(409, "Finish the current quiz attempt before starting another one");
  const used = await prisma.quizAttempt.count({ where: { quizId, studentId } });
  if (used >= quiz.maxAttempts) throw new AppError(409, "Maximum quiz attempts reached");
  return prisma.quizAttempt.create({ data: { quizId, studentId, attemptNumber: used + 1 }, select: { id: true, quizId: true, attemptNumber: true, status: true, startedAt: true } });
}
export async function listMyAttempts(quizId: string, studentId: string) {
  if (!UUID.test(quizId)) throw new AppError(404, "Quiz not found");
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { lessonId: true } }); if (!quiz) throw new AppError(404, "Quiz not found");
  await assertLessonAccess(quiz.lessonId, { userId: studentId, role: "STUDENT" });
  const attempts = await prisma.quizAttempt.findMany({ where: { quizId, studentId }, orderBy: { attemptNumber: "desc" } });
  return attempts.map(item => ({ ...item, score: item.score === null ? null : Number(item.score) }));
}
export async function submitAttempt(attemptId: string, studentId: string, input: SubmitAttemptInput) {
  if (!UUID.test(attemptId)) throw new AppError(404, "Quiz attempt not found");
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId }, include: { quiz: { include: quizTree } } });
  if (!attempt || attempt.studentId !== studentId) throw new AppError(404, "Quiz attempt not found");
  if (attempt.status !== "IN_PROGRESS") throw new AppError(409, "Quiz attempt has already been submitted");
  const questionMap = new Map(attempt.quiz.questions.map(question => [question.id, question]));
  const answers = input.answers.map(answer => {
    const question = questionMap.get(answer.questionId); if (!question) throw new AppError(400, "An answer references a question outside this quiz");
    const option = question.options.find(item => item.id === answer.optionId); if (!option) throw new AppError(400, "An answer option does not belong to its question");
    return { questionId: question.id, optionId: option.id, isCorrect: option.isCorrect, pointsEarned: option.isCorrect ? question.points : 0 };
  });
  const totalPoints = attempt.quiz.questions.reduce((sum, question) => sum + question.points, 0);
  const earnedPoints = answers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
  const score = totalPoints ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0;
  const passed = score >= attempt.quiz.passingScore;
  await prisma.$transaction(async transaction => {
    const claimed = await transaction.quizAttempt.updateMany({ where: { id: attemptId, status: "IN_PROGRESS" }, data: { status: "SUBMITTED", score, earnedPoints, totalPoints, passed, submittedAt: new Date() } });
    if (!claimed.count) throw new AppError(409, "Quiz attempt has already been submitted");
    if (answers.length) await transaction.attemptAnswer.createMany({ data: answers.map(answer => ({ ...answer, attemptId })) });
  });
  return { id: attempt.id, quizId: attempt.quizId, attemptNumber: attempt.attemptNumber, status: "SUBMITTED" as const, score, earnedPoints, totalPoints, passed, submittedAt: new Date(), answers: attempt.quiz.questions.map(question => { const selected = answers.find(answer => answer.questionId === question.id); return { questionId: question.id, question: question.text, selectedOptionId: selected?.optionId ?? null, correctOptionId: question.options.find(option => option.isCorrect)?.id, isCorrect: selected?.isCorrect ?? false, pointsEarned: selected?.pointsEarned ?? 0, explanation: question.explanation }; }) };
}
