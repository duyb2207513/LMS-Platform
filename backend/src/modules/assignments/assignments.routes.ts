import { Router } from "express";
import { authenticate } from "../../common/middlewares/authenticate.js";
import { authorize } from "../../common/middlewares/authorize.js";
import { validateRequest } from "../../common/middlewares/validateRequest.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { uploadAssignmentAttachments, uploadSubmissionFiles } from "../../config/upload.js";
import {
  createAssignmentController, deleteAssignmentAttachmentController, deleteAssignmentController, downloadAssignmentAttachmentController, downloadSubmissionFileController, getAssignmentController,
  getCourseGradeRuleController, getMyCourseGradeController, getSubmissionController, gradeSubmissionController,
  listAssignmentSubmissionsController, listCourseAssignmentsController, listCourseGradesController,
  listMySubmissionsController, submitAssignmentController, updateAssignmentController, updateCourseGradeRuleController, uploadAssignmentAttachmentsController
} from "./assignments.controller.js";
import { validateCourseGradeRuleInput, validateCreateAssignmentInput, validateGradeSubmissionInput, validateUpdateAssignmentInput } from "./assignments.validation.js";

const manage = [authenticate, authorize("INSTRUCTOR", "ADMIN")] as const;
const student = [authenticate, authorize("STUDENT")] as const;

export const courseAssignmentsRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /courses/{courseId}/assignments:
 *   get:
 *     summary: List course assignments visible to the current user
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Assignments retrieved }, 403: { description: Enrollment or ownership required } }
 *   post:
 *     summary: Create an assignment (course instructor or admin)
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AssignmentRequest' }
 *     responses: { 201: { description: Assignment created }, 403: { description: Course ownership required } }
 */
courseAssignmentsRouter.get("/", authenticate, asyncHandler(listCourseAssignmentsController));
courseAssignmentsRouter.post("/", ...manage, validateRequest(validateCreateAssignmentInput), asyncHandler(createAssignmentController));

export const assignmentsRouter = Router();
/**
 * @openapi
 * /assignments/{assignmentId}:
 *   get:
 *     summary: Get an assignment and the current student's attempts
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: assignmentId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Assignment retrieved }, 403: { description: Enrollment required }, 404: { description: Assignment not found } }
 *   patch:
 *     summary: Update an assignment
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: assignmentId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/AssignmentRequest' } } } }
 *     responses: { 200: { description: Assignment updated }, 403: { description: Course ownership required } }
 *   delete:
 *     summary: Delete an assignment without submissions
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: assignmentId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Assignment deleted }, 409: { description: Assignment already has submissions } }
 */
assignmentsRouter.get("/:assignmentId", authenticate, asyncHandler(getAssignmentController));
assignmentsRouter.patch("/:assignmentId", ...manage, validateRequest(validateUpdateAssignmentInput), asyncHandler(updateAssignmentController));
assignmentsRouter.delete("/:assignmentId", ...manage, asyncHandler(deleteAssignmentController));
/** @openapi
 * /assignments/{assignmentId}/attachments:
 *   post: { summary: Upload images or files attached to an assignment prompt, tags: [Assignments], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: assignmentId, required: true, schema: { type: string, format: uuid } }], requestBody: { required: true, content: { multipart/form-data: { schema: { type: object, required: [files], properties: { files: { type: array, maxItems: 5, items: { type: string, format: binary } } } } } } }, responses: { 201: { description: Attachments uploaded }, 400: { description: Invalid type or size }, 403: { description: Course ownership required } } }
 */
assignmentsRouter.post("/:assignmentId/attachments",...manage,uploadAssignmentAttachments,asyncHandler(uploadAssignmentAttachmentsController));
/**
 * @openapi
 * /assignments/{assignmentId}/submissions:
 *   post:
 *     summary: Submit assignment text and up to five files
 *     tags: [Assignment submissions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: assignmentId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               textContent: { type: string, maxLength: 50000 }
 *               files: { type: array, maxItems: 5, items: { type: string, format: binary } }
 *     responses: { 201: { description: Assignment submitted }, 400: { description: Text or a valid file is required }, 409: { description: Deadline or attempt limit reached } }
 *   get:
 *     summary: List all submissions for grading (course instructor or admin)
 *     tags: [Assignment submissions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: assignmentId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Submissions retrieved }, 403: { description: Course ownership required } }
 * /assignments/{assignmentId}/submissions/me:
 *   get:
 *     summary: List the current student's submission attempts
 *     tags: [Assignment submissions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: assignmentId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Submission attempts retrieved }, 403: { description: Enrollment required } }
 */
assignmentsRouter.post("/:assignmentId/submissions", ...student, uploadSubmissionFiles, asyncHandler(submitAssignmentController));
assignmentsRouter.get("/:assignmentId/submissions/me", ...student, asyncHandler(listMySubmissionsController));
assignmentsRouter.get("/:assignmentId/submissions", ...manage, asyncHandler(listAssignmentSubmissionsController));

export const submissionsRouter = Router();
/**
 * @openapi
 * /submissions/{submissionId}:
 *   get:
 *     summary: Get submission detail (student owner, course instructor or admin)
 *     tags: [Assignment submissions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: submissionId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Submission retrieved }, 403: { description: Submission access denied } }
 * /submissions/{submissionId}/grade:
 *   patch:
 *     summary: Grade or re-grade a submission
 *     tags: [Assignment grading]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: submissionId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/GradeSubmissionRequest' } } } }
 *     responses: { 200: { description: Submission graded }, 400: { description: Score exceeds assignment maximum }, 403: { description: Course ownership required } }
 */
submissionsRouter.get("/:submissionId", authenticate, asyncHandler(getSubmissionController));
submissionsRouter.patch("/:submissionId/grade", ...manage, validateRequest(validateGradeSubmissionInput), asyncHandler(gradeSubmissionController));

export const submissionFilesRouter = Router();
/**
 * @openapi
 * /submission-files/{fileId}/download:
 *   get:
 *     summary: Download a protected assignment submission file
 *     tags: [Assignment submissions]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: fileId, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200:
 *         description: Submission file
 *         content: { application/octet-stream: { schema: { type: string, format: binary } } }
 *       403: { description: Only the student owner, course instructor or admin may download this file }
 *       404: { description: File not found }
 */
submissionFilesRouter.get("/:fileId/download", authenticate, asyncHandler(downloadSubmissionFileController));

export const assignmentAttachmentsRouter=Router();
/** @openapi
 * /assignment-attachments/{attachmentId}/download:
 *   get: { summary: Download an assignment prompt attachment, tags: [Assignments], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: attachmentId, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: Attachment file }, 403: { description: Enrollment or ownership required } } }
 * /assignment-attachments/{attachmentId}:
 *   delete: { summary: Delete an assignment prompt attachment, tags: [Assignments], security: [{ bearerAuth: [] }], parameters: [{ in: path, name: attachmentId, required: true, schema: { type: string, format: uuid } }], responses: { 204: { description: Attachment deleted }, 403: { description: Course ownership required } } }
 */
assignmentAttachmentsRouter.get("/:attachmentId/download",authenticate,asyncHandler(downloadAssignmentAttachmentController));
assignmentAttachmentsRouter.delete("/:attachmentId",...manage,asyncHandler(deleteAssignmentAttachmentController));

export const courseGradesRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /courses/{courseId}/grades/rule:
 *   get:
 *     summary: Get assignment/quiz grade weights
 *     tags: [Course grades]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Grade rule retrieved } }
 *   put:
 *     summary: Configure assignment/quiz weights (must total 100)
 *     tags: [Course grades]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CourseGradeRuleRequest' } } } }
 *     responses: { 200: { description: Grade rule updated }, 400: { description: Weights must total 100 } }
 * /courses/{courseId}/grades/me:
 *   get:
 *     summary: Get current student's final course grade
 *     tags: [Course grades]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Course grade calculated }, 403: { description: Enrollment required } }
 * /courses/{courseId}/grades:
 *   get:
 *     summary: Calculate final grades for all enrolled students
 *     tags: [Course grades]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Course grades calculated }, 403: { description: Course ownership required } }
 */
courseGradesRouter.get("/rule", authenticate, asyncHandler(getCourseGradeRuleController));
courseGradesRouter.put("/rule", ...manage, validateRequest(validateCourseGradeRuleInput), asyncHandler(updateCourseGradeRuleController));
courseGradesRouter.get("/me", ...student, asyncHandler(getMyCourseGradeController));
courseGradesRouter.get("/", ...manage, asyncHandler(listCourseGradesController));
