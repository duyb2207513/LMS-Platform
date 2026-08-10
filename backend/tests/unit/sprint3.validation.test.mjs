import assert from "node:assert/strict";
import { validateCreateQuizInput, validateCreateQuestionInput, validateCreateOptionInput, validateSubmitAttemptInput } from "../../dist/modules/quizzes/quizzes.validation.js";
import { validateCreateReviewInput } from "../../dist/modules/reviews/reviews.validation.js";
import { validateCreateCommentInput } from "../../dist/modules/comments/comments.validation.js";

assert.deepEqual(validateCreateQuizInput({ title: "  Final quiz  ", passingScore: 70, maxAttempts: 2 }).data, { title: "Final quiz", passingScore: 70, maxAttempts: 2 });
assert.ok(validateCreateQuizInput({ title: "Quiz", passingScore: 101 }).errors.passingScore);
assert.ok(validateCreateQuestionInput({ text: "" }).errors.text);
assert.deepEqual(validateCreateOptionInput({ text: " A ", isCorrect: true }).data, { text: "A", isCorrect: true });
assert.ok(validateSubmitAttemptInput({ answers: [{ questionId: "q", optionId: "a" }, { questionId: "q", optionId: "b" }] }).errors["answers.1.questionId"]);
assert.ok(validateCreateReviewInput({ rating: 6 }).errors.rating);
assert.deepEqual(validateCreateCommentInput({ content: "  Helpful  ", parentId: null }).data, { content: "Helpful", parentId: null });
console.log("Sprint 3 validation tests passed");
