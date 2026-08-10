import { Router } from "express"; import { authenticate } from "../../common/middlewares/authenticate.js"; import { authorize } from "../../common/middlewares/authorize.js"; import { asyncHandler } from "../../common/utils/asyncHandler.js"; import { getCertificateController, issueCertificateController, listMyCertificatesController, revokeCertificateController, verifyCertificateController } from "./certificates.controller.js";
export const courseCertificatesRouter = Router({ mergeParams: true });
/**
 * @openapi
 * /courses/{courseId}/certificates:
 *   post:
 *     summary: Issue a certificate after lessons are complete and all published quizzes are passed
 *     tags: [Certificates]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: courseId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 201: { description: Certificate issued or existing certificate returned }, 403: { description: Enrollment required }, 409: { description: Completion requirements not met } }
 */
courseCertificatesRouter.post("/", authenticate, authorize("STUDENT"), asyncHandler(issueCertificateController));
const router = Router();
/**
 * @openapi
 * /certificates/me:
 *   get:
 *     summary: List current student's certificates
 *     tags: [Certificates]
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: Certificates retrieved successfully } }
 * /certificates/verify/{code}:
 *   get:
 *     summary: Publicly verify a certificate number or verification code
 *     tags: [Certificates]
 *     parameters: [{ in: path, name: code, required: true, schema: { type: string } }]
 *     responses: { 200: { description: Certificate validity and snapshot data }, 404: { description: Certificate not found } }
 * /certificates/{certificateId}:
 *   get:
 *     summary: Get own certificate detail
 *     tags: [Certificates]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: certificateId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Certificate retrieved successfully }, 404: { description: Certificate not found } }
 *   delete:
 *     summary: Revoke a certificate (admin only)
 *     tags: [Certificates]
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: certificateId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Certificate revoked successfully } }
 */
router.get("/me", authenticate, authorize("STUDENT"), asyncHandler(listMyCertificatesController)); router.get("/verify/:code", asyncHandler(verifyCertificateController)); router.get("/:certificateId", authenticate, asyncHandler(getCertificateController)); router.delete("/:certificateId", authenticate, authorize("ADMIN"), asyncHandler(revokeCertificateController)); export default router;
