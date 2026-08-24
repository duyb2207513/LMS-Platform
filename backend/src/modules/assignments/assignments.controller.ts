import { unlink } from "node:fs/promises"; import path from "node:path"; import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/response.js";
import { deleteFromCloudinary } from "../../config/cloudinary.js"; import { ASSIGNMENT_ATTACHMENT_DIRECTORY } from "../../config/upload.js";
import type { AssignmentInput, CourseGradeRuleInput, GradeSubmissionInput, UpdateAssignmentInput } from "./assignments.types.js";
import {
  addAssignmentAttachments, createAssignment, deleteAssignment, deleteAssignmentAttachment, getAssignment, getAssignmentAttachment, getCourseGradeRule, getMyCourseGrade, getSubmission,
  getSubmissionFile, gradeSubmission, listAssignmentSubmissions, listCourseAssignments, listCourseGrades,
  listMySubmissions, submitAssignment, updateAssignment, updateCourseGradeRule
} from "./assignments.service.js";

const p = (request: Request, key: string) => String(request.params[key] ?? "");

export async function listCourseAssignmentsController(request: Request, response: Response) { sendSuccess(response, 200, "Assignments retrieved successfully", await listCourseAssignments(p(request, "courseId"), request.auth!)); }
export async function getAssignmentController(request: Request, response: Response) { sendSuccess(response, 200, "Assignment retrieved successfully", await getAssignment(p(request, "assignmentId"), request.auth!)); }
export async function createAssignmentController(request: Request, response: Response) { sendSuccess(response, 201, "Assignment created successfully", await createAssignment(p(request, "courseId"), request.auth!, request.body as AssignmentInput)); }
export async function updateAssignmentController(request: Request, response: Response) { sendSuccess(response, 200, "Assignment updated successfully", await updateAssignment(p(request, "assignmentId"), request.auth!, request.body as UpdateAssignmentInput)); }
async function removeAttachment(storedName:string){if(storedName.startsWith("http"))await Promise.allSettled([deleteFromCloudinary(storedName,"raw"),deleteFromCloudinary(storedName,"image")]);else await unlink(path.join(ASSIGNMENT_ATTACHMENT_DIRECTORY,path.basename(storedName))).catch(()=>undefined);}
export async function deleteAssignmentController(request: Request, response: Response) { const files=await deleteAssignment(p(request, "assignmentId"), request.auth!);await Promise.all(files.map(removeAttachment)); response.status(204).send(); }
export async function uploadAssignmentAttachmentsController(request:Request,response:Response){const files=Array.isArray(request.files)?request.files:[];sendSuccess(response,201,"Assignment attachments uploaded successfully",await addAssignmentAttachments(p(request,"assignmentId"),request.auth!,files,`${request.protocol}://${request.get("host")}`));}
export async function deleteAssignmentAttachmentController(request:Request,response:Response){await removeAttachment(await deleteAssignmentAttachment(p(request,"attachmentId"),request.auth!));response.status(204).send();}
export async function downloadAssignmentAttachmentController(request:Request,response:Response){const file=await getAssignmentAttachment(p(request,"attachmentId"),request.auth!);if(file.path.startsWith("http")){response.redirect(file.path);return;}response.type(file.mimeType).download(file.path,file.name);}
export async function submitAssignmentController(request: Request, response: Response) {
  const files = Array.isArray(request.files) ? request.files : [];
  const baseUrl = `${request.protocol}://${request.get("host")}`;
  sendSuccess(response, 201, "Assignment submitted successfully", await submitAssignment(p(request, "assignmentId"), request.auth!.userId, request.body?.textContent, files, baseUrl));
}
export async function listMySubmissionsController(request: Request, response: Response) { sendSuccess(response, 200, "My submissions retrieved successfully", await listMySubmissions(p(request, "assignmentId"), request.auth!.userId)); }
export async function listAssignmentSubmissionsController(request: Request, response: Response) { sendSuccess(response, 200, "Assignment submissions retrieved successfully", await listAssignmentSubmissions(p(request, "assignmentId"), request.auth!)); }
export async function getSubmissionController(request: Request, response: Response) { sendSuccess(response, 200, "Submission retrieved successfully", await getSubmission(p(request, "submissionId"), request.auth!)); }
export async function gradeSubmissionController(request: Request, response: Response) { sendSuccess(response, 200, "Submission graded successfully", await gradeSubmission(p(request, "submissionId"), request.auth!, request.body as GradeSubmissionInput)); }
export async function downloadSubmissionFileController(request: Request, response: Response) {
  const file = await getSubmissionFile(p(request, "fileId"), request.auth!);
  if (file.path.startsWith("http://") || file.path.startsWith("https://")) {
    response.redirect(file.path);
    return;
  }
  response.type(file.mimeType).download(file.path, file.name);
}
export async function getCourseGradeRuleController(request: Request, response: Response) { sendSuccess(response, 200, "Course grade rule retrieved successfully", await getCourseGradeRule(p(request, "courseId"), request.auth!)); }
export async function updateCourseGradeRuleController(request: Request, response: Response) { sendSuccess(response, 200, "Course grade rule updated successfully", await updateCourseGradeRule(p(request, "courseId"), request.auth!, request.body as CourseGradeRuleInput)); }
export async function getMyCourseGradeController(request: Request, response: Response) { sendSuccess(response, 200, "Course grade retrieved successfully", await getMyCourseGrade(p(request, "courseId"), request.auth!.userId)); }
export async function listCourseGradesController(request: Request, response: Response) { sendSuccess(response, 200, "Course grades retrieved successfully", await listCourseGrades(p(request, "courseId"), request.auth!)); }
