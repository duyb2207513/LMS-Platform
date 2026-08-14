import assert from "node:assert/strict";
import {
  validateCourseGradeRuleInput,
  validateCreateAssignmentInput,
  validateGradeSubmissionInput,
  validateUpdateAssignmentInput
} from "../../dist/modules/assignments/assignments.validation.js";

const valid = validateCreateAssignmentInput({
  title: "  REST API assignment  ",
  dueAt: "2027-01-01T00:00:00.000Z",
  maxScore: 100,
  allowResubmission: true,
  maxSubmissions: 3,
  allowLateSubmissions: false,
  isPublished: true
});
assert.equal(valid.errors, undefined);
assert.equal(valid.data.title, "REST API assignment");
assert.ok(valid.data.dueAt instanceof Date);

assert.ok(validateCreateAssignmentInput({ title: "", dueAt: "invalid" }).errors);
assert.ok(validateCreateAssignmentInput({ title: "Test", dueAt: "2027-01-01T00:00:00Z", allowResubmission: false, maxSubmissions: 2 }).errors?.maxSubmissions);
assert.ok(validateUpdateAssignmentInput({ role: "ADMIN" }).errors?.role);
assert.ok(validateUpdateAssignmentInput({}).errors?.body);

assert.equal(validateGradeSubmissionInput({ score: 85.5, comment: "Good" }).data?.score, 85.5);
assert.ok(validateGradeSubmissionInput({ score: -1 }).errors?.score);
assert.ok(validateGradeSubmissionInput({ comment: "Missing score" }).errors?.score);

assert.equal(validateCourseGradeRuleInput({ assignmentWeight: 60, quizWeight: 40, passingScore: 70 }).errors, undefined);
assert.ok(validateCourseGradeRuleInput({ assignmentWeight: 70, quizWeight: 40, passingScore: 70 }).errors?.weights);
assert.ok(validateCourseGradeRuleInput({ assignmentWeight: 60, quizWeight: 40, passingScore: 101 }).errors?.passingScore);

console.log("Sprint 7 assignment validation tests passed");
